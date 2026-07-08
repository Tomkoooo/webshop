import type { AdminOrderFilters } from "@wse/core/lib/admin-orders-filters"
import { shopDateRangeUtc, shopDayEndUtc, shopDayStartUtc } from "@wse/core/lib/shop-timezone"

export type MongoDateRange = { $gte?: Date; $lte?: Date }

export function buildShopCalendarDateRange(filters: {
  on?: string
  from?: string
  to?: string
}): MongoDateRange | null {
  if (filters.on) {
    const start = shopDayStartUtc(filters.on)
    const end = shopDayEndUtc(filters.on)
    if (!start || !end) return null
    return { $gte: start, $lte: end }
  }

  const range = shopDateRangeUtc(filters.from, filters.to)
  if (!range.$gte && !range.$lte) return null
  return range
}

function hasNoStatusHistoryClause() {
  return {
    $or: [
      { statusHistory: { $exists: false } },
      { statusHistory: null },
      { statusHistory: { $size: 0 } },
    ],
  }
}

/**
 * Finds orders that transitioned to a given status during a calendar day/range.
 * Uses statusHistory when available; falls back to statusChangedAt for legacy rows.
 */
export function buildStatusTransitionQuery(
  filters: AdminOrderFilters
): Record<string, unknown> | null {
  const range = buildShopCalendarDateRange({
    on: filters.statusChangedOn,
    from: filters.statusChangedFrom,
    to: filters.statusChangedTo,
  })
  if (!range) return null

  const targetStatus =
    filters.status && filters.status !== "all" ? filters.status : undefined

  if (targetStatus) {
    return {
      $or: [
        {
          statusHistory: {
            $elemMatch: {
              to: targetStatus,
              changedAt: range,
            },
          },
        },
        {
          statusChangedAt: range,
          ...hasNoStatusHistoryClause(),
        },
      ],
    }
  }

  return {
    $or: [
      { statusHistory: { $elemMatch: { changedAt: range } } },
      {
        statusChangedAt: range,
        ...hasNoStatusHistoryClause(),
      },
    ],
  }
}

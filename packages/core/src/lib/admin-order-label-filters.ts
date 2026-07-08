import type { AdminOrderFilters } from "@wse/core/lib/admin-orders-filters"
import { buildShopCalendarDateRange } from "@wse/core/lib/admin-order-status-filters"

function labelGeneratedRangeQuery(
  field: string,
  filters: { on?: string; from?: string; to?: string }
): Record<string, unknown> | null {
  const range = buildShopCalendarDateRange(filters)
  if (!range) return null
  return { [field]: range }
}

/** Orders with a Foxpost label generated on the given Budapest calendar day/range. */
export function buildFoxpostLabelGeneratedQuery(
  filters: AdminOrderFilters
): Record<string, unknown> | null {
  return labelGeneratedRangeQuery("foxpostShipment.generatedAt", {
    on: filters.foxpostLabelOn,
    from: filters.foxpostLabelFrom,
    to: filters.foxpostLabelTo,
  })
}

/** Orders with a GLS label generated on the given Budapest calendar day/range. */
export function buildGlsLabelGeneratedQuery(
  filters: AdminOrderFilters
): Record<string, unknown> | null {
  return labelGeneratedRangeQuery("glsLabel.generatedAt", {
    on: filters.glsLabelOn,
    from: filters.glsLabelFrom,
    to: filters.glsLabelTo,
  })
}

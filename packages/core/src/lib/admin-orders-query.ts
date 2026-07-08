import mongoose from "mongoose"
import {
  matchesOrderShippingTypeFilter,
  type OrderShippingTypeFilter,
} from "@wse/core/lib/parcel-locker"
import { formatOrderNumber } from "@wse/core/lib/order-number"
import { buildStatusTransitionQuery } from "@wse/core/lib/admin-order-status-filters"
import {
  buildFoxpostLabelGeneratedQuery,
  buildGlsLabelGeneratedQuery,
} from "@wse/core/lib/admin-order-label-filters"
import { shopDateRangeUtc } from "@wse/core/lib/shop-timezone"
import {
  ADMIN_ORDER_DELETED_STATUS,
  resolveAdminOrderDeletedFilter,
  type AdminOrderFilters,
} from "@wse/core/lib/admin-orders-filters"
import {
  applyWorkspaceFilters,
  summarizeOrder,
  type BillingTypeFilter,
  type LabelStateFilter,
  type WorkspaceFilters,
  type WorkspaceSortKey,
} from "@wse/core/lib/admin-orders-workspace"

export type {
  AdminOrderDeletedFilter,
  AdminOrderFilters,
} from "@wse/core/lib/admin-orders-filters"

export {
  ADMIN_ORDER_DELETED_STATUS,
  isAdminDeletedOrder,
  parseAdminOrderFiltersFromSearchParams,
  resolveAdminOrderDeletedFilter,
} from "@wse/core/lib/admin-orders-filters"

/** Comma-separated Mongo order ids from export/download query params. */
export function parseAdminOrderIdsParam(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return []
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )
  )
}

function parseOptionalNumber(value?: string): number | undefined {
  if (value == null || value === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function appendShopDateRange(
  query: Record<string, unknown>,
  field: string,
  from?: string,
  to?: string
) {
  const range = shopDateRangeUtc(from, to)
  if (!range.$gte && !range.$lte) return
  query[field] = range
}

function appendAndClause(query: Record<string, unknown>, clause: Record<string, unknown>) {
  const existing = query.$and
  query.$and = Array.isArray(existing) ? [...existing, clause] : [clause]
}

/** Maps URL/admin filter params to in-memory workspace smart filters. */
export function adminFiltersToWorkspaceFilters(filters: AdminOrderFilters = {}): WorkspaceFilters {
  const shippingType = (filters.shippingType || "all") as OrderShippingTypeFilter
  const labelState = (filters.labelState || "all") as LabelStateFilter
  const billingType = (filters.billingType || "all") as BillingTypeFilter
  return {
    q: filters.q,
    shippingType,
    unitsMin: parseOptionalNumber(filters.unitsMin),
    unitsMax: parseOptionalNumber(filters.unitsMax),
    kindsMin: parseOptionalNumber(filters.kindsMin),
    kindsMax: parseOptionalNumber(filters.kindsMax),
    totalMin: parseOptionalNumber(filters.totalMin),
    totalMax: parseOptionalNumber(filters.totalMax),
    labelState,
    billingType,
    mix: filters.mix || undefined,
    sort: (filters.sort as WorkspaceSortKey) || "newest",
  }
}

export function buildAdminOrdersMongoQuery(filters: AdminOrderFilters = {}): Record<string, unknown> {
  const query: Record<string, unknown> = {}
  const deletedFilter = resolveAdminOrderDeletedFilter(filters)

  if (deletedFilter === "deleted") {
    query.status = ADMIN_ORDER_DELETED_STATUS
  } else if (filters.status && filters.status !== "all") {
    query.status = filters.status
  } else {
    query.status = { $ne: ADMIN_ORDER_DELETED_STATUS }
  }
  if (filters.invoiceStatus && filters.invoiceStatus !== "all") {
    query.invoiceStatus = filters.invoiceStatus
  }
  if (filters.productId && filters.productId !== "all") {
    if (mongoose.Types.ObjectId.isValid(filters.productId)) {
      query["items.product"] = new mongoose.Types.ObjectId(filters.productId)
    }
  }
  if (filters.dateFrom || filters.dateTo) {
    appendShopDateRange(query, "createdAt", filters.dateFrom, filters.dateTo)
  }
  if (filters.updatedFrom || filters.updatedTo) {
    appendShopDateRange(query, "updatedAt", filters.updatedFrom, filters.updatedTo)
  }

  const statusTransitionQuery = buildStatusTransitionQuery(filters)
  if (statusTransitionQuery) {
    appendAndClause(query, statusTransitionQuery)
  }

  const foxpostLabelQuery = buildFoxpostLabelGeneratedQuery(filters)
  if (foxpostLabelQuery) {
    appendAndClause(query, foxpostLabelQuery)
  }

  const glsLabelQuery = buildGlsLabelGeneratedQuery(filters)
  if (glsLabelQuery) {
    appendAndClause(query, glsLabelQuery)
  }

  return query
}

/**
 * Applies the same in-memory smart filters as the admin orders workspace
 * (units, mix, label state, billing type, text search, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin order snapshots are dynamic JSON
export function filterAdminOrdersWithWorkspace(orders: any[], filters: AdminOrderFilters = {}): any[] {
  const workspaceFilters = adminFiltersToWorkspaceFilters(filters)
  const summaries = orders.map((order) =>
    summarizeOrder(order as Parameters<typeof summarizeOrder>[0])
  )
  const allowedIds = new Set(
    applyWorkspaceFilters(summaries, workspaceFilters).map((summary) => summary.id)
  )
  return orders.filter((order) => allowedIds.has(String(order._id)))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- admin order snapshots are dynamic JSON
export function filterAdminOrders(orders: any[], filters: AdminOrderFilters = {}): any[] {
  let result = orders

  const shippingType = (filters.shippingType || "all") as OrderShippingTypeFilter
  if (shippingType !== "all") {
    result = result.filter((order) =>
      matchesOrderShippingTypeFilter(
        order as {
          glsParcelPoint?: { id?: string } | null
          foxpostParcelPoint?: { id?: string } | null
        },
        shippingType
      )
    )
  }

  const search = String(filters.q || "").trim().toLowerCase()
  if (!search) return result

  return result.filter((order) => {
    const items = Array.isArray(order.items) ? order.items : []
    const haystack = [
      formatOrderNumber(order._id),
      order._id,
      (order.billingInfo as { name?: string } | undefined)?.name,
      (order.billingInfo as { email?: string } | undefined)?.email,
      (order.billingInfo as { phone?: string } | undefined)?.phone,
      (order.shippingAddress as { name?: string } | undefined)?.name,
      (order.shippingAddress as { email?: string } | undefined)?.email,
      (order.shippingAddress as { phone?: string } | undefined)?.phone,
      (order.shippingAddress as { city?: string } | undefined)?.city,
      order.invoiceId,
      ...items.map((item: { name?: string }) => item.name),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
    return haystack.includes(search)
  })
}

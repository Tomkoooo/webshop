import type { AdminOrderFilters } from "@wse/core/lib/admin-orders-filters"

const ADVANCED_FILTER_KEYS: (keyof AdminOrderFilters)[] = [
  "invoiceStatus",
  "labelState",
  "billingType",
  "updatedFrom",
  "updatedTo",
  "statusChangedOn",
  "statusChangedFrom",
  "statusChangedTo",
  "foxpostLabelOn",
  "foxpostLabelFrom",
  "foxpostLabelTo",
  "glsLabelOn",
  "glsLabelFrom",
  "glsLabelTo",
  "unitsMin",
  "unitsMax",
  "kindsMin",
  "kindsMax",
  "totalMin",
  "totalMax",
]

export function hasAdvancedOrderFilters(filters: AdminOrderFilters): boolean {
  return ADVANCED_FILTER_KEYS.some((key) => {
    const value = filters[key]
    return value != null && value !== "" && value !== "all"
  })
}

export function countAdvancedOrderFilters(filters: AdminOrderFilters): number {
  return ADVANCED_FILTER_KEYS.filter((key) => {
    const value = filters[key]
    return value != null && value !== "" && value !== "all"
  }).length
}

export const ADMIN_ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Függőben" },
  { value: "processing", label: "Feldolgozás alatt" },
  { value: "shipped", label: "Szállítva" },
  { value: "delivered", label: "Kézbesítve" },
  { value: "cancelled", label: "Törölve" },
] as const

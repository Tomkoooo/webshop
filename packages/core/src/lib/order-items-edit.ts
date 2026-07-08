import { isAdminDeletedOrder } from "@wse/core/lib/admin-orders-filters";

const EDITABLE_ORDER_STATUSES = new Set(["pending", "processing"]);

export type OrderAddableProduct = {
  id: string;
  name: string;
  stock: number;
  requiresVariant: boolean;
  variants: Array<{ id: string; label: string; stock: number }>;
};

export function canEditOrderItems(order: { status: string }): boolean {
  if (isAdminDeletedOrder(order.status)) return false;
  return EDITABLE_ORDER_STATUSES.has(order.status);
}

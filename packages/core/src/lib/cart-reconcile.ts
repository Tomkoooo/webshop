import type { CartItem } from "@wse/core/store/useCartStore";

const REMOVE_PATTERNS = [
  /nincs raktáron/i,
  /nem elérhető/i,
  /nem található/i,
  /nem rendelhető/i,
  /érvénytelen variáns/i,
];

function shouldRemoveLine(issue: string | undefined): boolean {
  if (!issue) return false;
  return REMOVE_PATTERNS.some((re) => re.test(issue));
}

/** Apply /api/cart/validate issues to cart lines (drop sold-out, clamp qty). */
export function reconcileCartItemsWithIssues(
  items: CartItem[],
  issues: Record<string, string>
): CartItem[] {
  const next: CartItem[] = [];

  for (const item of items) {
    const issue = issues[item.id];
    if (shouldRemoveLine(issue)) continue;

    let quantity = item.quantity;
    const stock = Number(item.stock);
    if (Number.isFinite(stock) && stock >= 0) {
      quantity = Math.min(quantity, stock);
    }
    if (quantity < 1) continue;

    next.push({ ...item, quantity });
  }

  return next;
}

export function cartItemsNeedReconcile(
  before: CartItem[],
  after: CartItem[]
): boolean {
  if (before.length !== after.length) return true;
  const sig = (items: CartItem[]) =>
    items
      .map((i) => `${i.id}:${i.quantity}:${i.stock}:${i.price}`)
      .sort()
      .join("|");
  return sig(before) !== sig(after);
}

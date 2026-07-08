import { describe, expect, it } from "vitest";
import { reconcileCartItemsWithIssues } from "@wse/core/lib/cart-reconcile";
import type { CartItem } from "@wse/core/store/useCartStore";

const line = (id: string, stock: number, qty = 1): CartItem => ({
  id,
  productId: "p1",
  variantId: id.includes(":") ? id.split(":")[1] : undefined,
  name: "Comic",
  slug: "comic",
  price: 1000,
  image: "",
  quantity: qty,
  stock,
  netPrice: 800,
  discount: 0,
});

describe("reconcileCartItemsWithIssues", () => {
  it("removes sold-out lines", () => {
    const items = [line("p1:num-36", 0), line("p1:num-37", 1)];
    const next = reconcileCartItemsWithIssues(items, {
      "p1:num-36": "A termék jelenleg nincs raktáron.",
    });
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("p1:num-37");
  });

  it("clamps quantity to stock", () => {
    const items = [line("p1", 2, 5)];
    const next = reconcileCartItemsWithIssues(items, {});
    expect(next[0].quantity).toBe(2);
  });
});

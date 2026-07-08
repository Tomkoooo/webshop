import { describe, expect, it } from "vitest"
import {
  areCartItemsSyncEqual,
  cartLineProductId,
  cartItemsSyncSignature,
  dbCartItemsToCartItems,
  mergeLocalAndServerCart,
} from "@wse/core/lib/cart-sync"
import type { CartItem } from "@wse/core/store/useCartStore"

describe("cart-sync helpers", () => {
  it("cartLineProductId prefers productId", () => {
    expect(cartLineProductId({ id: "line-1", productId: "prod-1" })).toBe("prod-1")
    expect(cartLineProductId({ id: "prod-2" })).toBe("prod-2")
  })

  it("cartItemsSyncSignature ignores order and normalizes quantity", () => {
    const a = [
      { id: "p2", productId: "p2", quantity: 0 },
      { id: "p1", productId: "p1", quantity: 2 },
    ]
    const b = [
      { id: "p1", productId: "p1", quantity: 2 },
      { id: "p2", productId: "p2", quantity: 1 },
    ]

    expect(cartItemsSyncSignature(a)).toBe(cartItemsSyncSignature(b))
    expect(areCartItemsSyncEqual(a, b)).toBe(true)
  })

  it("cartItemsSyncSignature distinguishes variant lines from product-only lines", () => {
    const variantLine = [{ id: "p1:v1", productId: "p1", variantId: "v1", quantity: 1 }]
    const productLine = [{ id: "p1", productId: "p1", quantity: 1 }]
    expect(cartItemsSyncSignature(variantLine)).not.toBe(cartItemsSyncSignature(productLine))
  })

  it("dbCartItemsToCartItems skips inactive products", () => {
    const items = dbCartItemsToCartItems([
      {
        quantity: 2,
        product: {
          _id: "p1",
          name: "A",
          slug: "a",
          netPrice: 1000,
          stock: 5,
          isActive: true,
          isVisible: true,
        },
      },
      {
        quantity: 1,
        product: {
          _id: "p2",
          name: "B",
          slug: "b",
          netPrice: 500,
          stock: 1,
          isActive: false,
          isVisible: true,
        },
      },
    ])
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe("p1")
    expect(items[0].quantity).toBe(2)
  })

  it("mergeLocalAndServerCart keeps both variant lines for same product", () => {
    const local: CartItem[] = [
      {
        id: "p1:v1",
        productId: "p1",
        variantId: "v1",
        name: "A #1",
        slug: "p1",
        price: 100,
        image: "",
        quantity: 1,
        stock: 1,
        netPrice: 80,
        discount: 0,
      },
      {
        id: "p1:v2",
        productId: "p1",
        variantId: "v2",
        name: "A #2",
        slug: "p1",
        price: 100,
        image: "",
        quantity: 1,
        stock: 1,
        netPrice: 80,
        discount: 0,
      },
    ]
    const server: CartItem[] = []
    const merged = mergeLocalAndServerCart(local, server)
    expect(merged).toHaveLength(2)
  })

  it("mergeLocalAndServerCart keeps variant lines and adds server-only products", () => {
    const local: CartItem[] = [
      {
        id: "p1:v1",
        productId: "p1",
        variantId: "v1",
        name: "Variant",
        slug: "p1",
        price: 100,
        image: "",
        quantity: 1,
        stock: 3,
        netPrice: 80,
        discount: 0,
      },
    ]
    const server: CartItem[] = [
      {
        id: "p1",
        productId: "p1",
        name: "Base",
        slug: "p1",
        price: 90,
        image: "",
        quantity: 2,
        stock: 3,
        netPrice: 70,
        discount: 0,
      },
      {
        id: "p2",
        productId: "p2",
        name: "Other",
        slug: "p2",
        price: 50,
        image: "",
        quantity: 1,
        stock: 10,
        netPrice: 40,
        discount: 0,
      },
    ]

    const merged = mergeLocalAndServerCart(local, server)
    expect(merged).toHaveLength(3)
    expect(merged[0].id).toBe("p1:v1")
    expect(merged.map((l) => l.productId)).toContain("p2")
    expect(merged.some((l) => l.id === "p1" && !l.variantId)).toBe(true)
  })
})

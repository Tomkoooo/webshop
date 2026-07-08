import { describe, expect, it } from "vitest"
import {
  allPurchasableVariantsInCart,
  mapProductToCheckoutSuggestion,
  pickCheapestInStockVariantId,
} from "@wse/core/lib/checkout-suggestion-product"

const baseProduct = {
  _id: "p1",
  slug: "test-product",
  name: "Test",
  description: "Test description",
  netPrice: 1000,
  stock: 0,
  vatPercent: 27,
  images: ["/img.jpg"],
}

describe("mapProductToCheckoutSuggestion", () => {
  it("uses variant stock when product-level stock is zero", () => {
    const dto = mapProductToCheckoutSuggestion({
      ...baseProduct,
      requireVariantSelection: true,
      variants: [
        { id: "v1", netPrice: 2000, discount: 0, stock: 3, isActive: true },
        { id: "v2", netPrice: 1500, discount: 0, stock: 2, isActive: true, isDefault: true },
      ],
    })
    expect(dto).not.toBeNull()
    expect(dto?.requiresVariantChoice).toBe(true)
    expect(dto?.variants).toHaveLength(2)
    expect(dto?.variantId).toBe("v2")
  })

  it("returns a simple product when there are no variants", () => {
    const dto = mapProductToCheckoutSuggestion({
      ...baseProduct,
      stock: 5,
    })
    expect(dto?.id).toBe("p1")
    expect(dto?.requiresVariantChoice).toBe(false)
  })

  it("returns null when no stock anywhere", () => {
    const dto = mapProductToCheckoutSuggestion({
      ...baseProduct,
      variants: [{ id: "v1", netPrice: 1000, discount: 0, stock: 0, isActive: true }],
    })
    expect(dto).toBeNull()
  })
})

describe("allPurchasableVariantsInCart", () => {
  it("is false when only one of two variants is in the cart", () => {
    const inCart = allPurchasableVariantsInCart(
      {
        ...baseProduct,
        variants: [
          { id: "v1", netPrice: 1000, discount: 0, stock: 1, isActive: true },
          { id: "v2", netPrice: 1000, discount: 0, stock: 1, isActive: true },
        ],
      },
      "p1",
      new Set(["p1:v1"])
    )
    expect(inCart).toBe(false)
  })
})

describe("pickCheapestInStockVariantId", () => {
  it("picks cheapest in-stock variant", () => {
    expect(
      pickCheapestInStockVariantId({
        vatPercent: 27,
        variants: [
          { id: "a", netPrice: 10000, discount: 0, stock: 1, isActive: true },
          { id: "b", netPrice: 5000, discount: 0, stock: 1, isActive: true },
        ],
      })
    ).toBe("b")
  })
})

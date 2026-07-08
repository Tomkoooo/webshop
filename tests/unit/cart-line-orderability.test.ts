import { describe, expect, it } from "vitest"
import { getCartLineOrderabilityMessage } from "@wse/core/lib/cart-line-orderability"

const baseProduct = {
  name: "Kalapács",
  isActive: true,
  isVisible: true,
  stock: 10,
  requireVariantSelection: false,
}

describe("getCartLineOrderabilityMessage", () => {
  it("returns null for an orderable simple product", () => {
    expect(
      getCartLineOrderabilityMessage(
        { productId: "p1", quantity: 2 },
        baseProduct
      )
    ).toBeNull()
  })

  it("flags inactive products (preview / test mode)", () => {
    expect(
      getCartLineOrderabilityMessage(
        { productId: "p1", quantity: 1 },
        { ...baseProduct, isActive: false }
      )
    ).toContain("nem vásárolható")
  })

  it("flags hidden products", () => {
    expect(
      getCartLineOrderabilityMessage(
        { productId: "p1", quantity: 1 },
        { ...baseProduct, isVisible: false }
      )
    ).toContain("nem elérhető")
  })

  it("flags missing products", () => {
    expect(
      getCartLineOrderabilityMessage({ productId: "p1", quantity: 1 }, null)
    ).toBe("A termék már nem található.")
  })

  it("flags insufficient stock", () => {
    expect(
      getCartLineOrderabilityMessage(
        { productId: "p1", quantity: 5 },
        { ...baseProduct, stock: 2 }
      )
    ).toContain("Csak 2 db rendelhető")
  })

  it("flags inactive variant and variant stock", () => {
    const product = {
      ...baseProduct,
      requireVariantSelection: true,
      variants: [
        { id: "v1", isActive: false, stock: 5 },
        { id: "v2", isActive: true, stock: 1 },
      ],
    }
    expect(
      getCartLineOrderabilityMessage(
        { productId: "p1", variantId: "v1", quantity: 1 },
        product
      )
    ).toContain("variáns")
    expect(
      getCartLineOrderabilityMessage(
        { productId: "p1", variantId: "v2", quantity: 3 },
        product
      )
    ).toContain("Csak 1 db rendelhető")
  })

  it("requires variant when configured", () => {
    expect(
      getCartLineOrderabilityMessage(
        { productId: "p1", quantity: 1 },
        {
          ...baseProduct,
          variants: [{ id: "v1", isActive: true, stock: 3 }],
          requireVariantSelection: true,
        }
      )
    ).toContain("Válassz variánst")
  })
})

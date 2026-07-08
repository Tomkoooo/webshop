import { describe, expect, it } from "vitest"
import {
  hasInStockNumberedVariants,
  productRequiresVariantPurchase,
  shouldShowNumberedVariantPicker,
} from "@wse/core/lib/unique-numbered-variants"

const numberedProduct = {
  uniqueNumberedVariants: { enabled: true, attributeName: "Szám", maxQuantityPerLine: 1 },
  variants: [
    { id: "num-1", isActive: true, stock: 0, attributes: { Szám: "1" } },
    { id: "base", isActive: true, stock: 5, attributes: {} },
  ],
}

describe("numbered base fallback", () => {
  it("still requires variant choice when only base is in stock", () => {
    expect(hasInStockNumberedVariants(numberedProduct)).toBe(false)
    expect(shouldShowNumberedVariantPicker(numberedProduct)).toBe(false)
    expect(productRequiresVariantPurchase(numberedProduct)).toBe(true)
  })

  it("shows numbered picker while an issue is in stock", () => {
    const withStock = {
      ...numberedProduct,
      variants: [
        { id: "num-1", isActive: true, stock: 1, attributes: { Szám: "1" } },
        { id: "base", isActive: true, stock: 5, attributes: {} },
      ],
    }
    expect(shouldShowNumberedVariantPicker(withStock)).toBe(true)
    expect(productRequiresVariantPurchase(withStock)).toBe(true)
  })
})

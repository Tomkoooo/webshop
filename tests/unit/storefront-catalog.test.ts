import { describe, expect, it } from "vitest"
import {
  isStorefrontCatalogProduct,
  isStorefrontProductOrderable,
} from "@wse/core/lib/storefront-catalog"

describe("storefront-catalog", () => {
  it("isStorefrontCatalogProduct respects visibility", () => {
    expect(isStorefrontCatalogProduct({ isVisible: true })).toBe(true)
    expect(isStorefrontCatalogProduct({ isVisible: false })).toBe(false)
    expect(isStorefrontCatalogProduct({})).toBe(true)
  })

  it("isStorefrontProductOrderable respects active flag (preview mode)", () => {
    expect(isStorefrontProductOrderable({ isActive: true })).toBe(true)
    expect(isStorefrontProductOrderable({ isActive: false })).toBe(false)
    expect(isStorefrontProductOrderable({})).toBe(true)
  })
})

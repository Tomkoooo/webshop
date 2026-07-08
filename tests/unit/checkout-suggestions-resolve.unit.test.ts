import { describe, expect, it, vi, beforeEach } from "vitest"
import { resolveCheckoutSuggestionItems } from "@wse/core/services/checkout-product-suggestions"
import { ProductService } from "@wse/core/services/product"
import { DEFAULT_PRODUCT_SUGGESTION_SETTINGS } from "@wse/core/lib/product-suggestion-settings-schema"

const variantProduct = {
  _id: { toString: () => "p-variant" },
  slug: "variant-product",
  name: "Variant product",
  description: "Desc",
  netPrice: 5000,
  stock: 0,
  vatPercent: 27,
  images: ["img.jpg"],
  requireVariantSelection: true,
  variants: [
    {
      id: "v1",
      netPrice: 5000,
      discount: 0,
      stock: 4,
      isActive: true,
      attributes: { Méret: "M" },
    },
    {
      id: "v2",
      netPrice: 6000,
      discount: 0,
      stock: 2,
      isActive: true,
      attributes: { Méret: "L" },
    },
  ],
  __displayStock: 6,
}

const simpleProduct = {
  _id: { toString: () => "p-simple" },
  slug: "simple-product",
  name: "Simple",
  description: "Desc",
  netPrice: 3000,
  stock: 10,
  vatPercent: 27,
  images: ["img.jpg"],
  variants: [],
  __displayStock: 10,
}

describe("resolveCheckoutSuggestionItems", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns suggestions from random_catalog pool", async () => {
    vi.spyOn(ProductService, "getPaginated").mockResolvedValue({
      products: [variantProduct, simpleProduct],
      total: 2,
      pages: 1,
      currentPage: 1,
    })

    const items = await resolveCheckoutSuggestionItems(
      {
        ...DEFAULT_PRODUCT_SUGGESTION_SETTINGS,
        enabled: true,
        maxSuggestions: 6,
        sources: [{ type: "random_catalog" }],
      },
      { excludeProductIds: new Set(), excludeLineIds: new Set() }
    )

    expect(items.length).toBeGreaterThan(0)
    expect(items.some((i) => i.productId === "p-variant")).toBe(true)
    expect(items.some((i) => i.productId === "p-simple")).toBe(true)
  })

  it("includes variant options for multi-variant products", async () => {
    vi.spyOn(ProductService, "getPaginated").mockResolvedValue({
      products: [variantProduct],
      total: 1,
      pages: 1,
      currentPage: 1,
    })

    const items = await resolveCheckoutSuggestionItems(
      {
        ...DEFAULT_PRODUCT_SUGGESTION_SETTINGS,
        enabled: true,
        maxSuggestions: 3,
        sources: [{ type: "random_catalog" }],
      },
      { excludeProductIds: new Set(), excludeLineIds: new Set() }
    )

    const row = items.find((i) => i.productId === "p-variant")
    expect(row?.variants?.length).toBe(2)
    expect(row?.requiresVariantChoice).toBe(true)
  })
})

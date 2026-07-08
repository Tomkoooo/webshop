import { describe, expect, it } from "vitest"
import { toStorefrontProduct } from "@wse/core/lib/storefront-product"

describe("toStorefrontProduct", () => {
  it("removes inactive variants and option values", () => {
    const product = {
      name: "Comic",
      variantOptions: [{ name: "Szám", values: ["36", "37", "38"] }],
      variants: [
        { id: "num-36", isActive: true, attributes: { Szám: "36" }, stock: 1 },
        { id: "num-37", isActive: false, attributes: { Szám: "37" }, stock: 1 },
        { id: "num-38", isActive: true, attributes: { Szám: "38" }, stock: 0 },
      ],
    }
    const out = toStorefrontProduct(product)
    expect(out.variants).toHaveLength(2)
    expect(out.variants?.map((v: { id: string }) => v.id)).toEqual(["num-36", "num-38"])
    expect(out.variantOptions?.[0]?.values).toEqual(["36", "38"])
  })
})

import { describe, expect, it } from "vitest"
import { shuffleInPlace } from "@wse/core/services/checkout-product-suggestions"
import { pickCheapestInStockVariantId } from "@wse/core/lib/checkout-suggestion-product"

describe("pickCheapestInStockVariantId", () => {
  it("returns undefined when no in-stock variants", () => {
    expect(
      pickCheapestInStockVariantId({
        variants: [
          { id: "a", netPrice: 1000, discount: 0, stock: 0, isActive: true },
          { id: "b", netPrice: 500, discount: 0, stock: 0, isActive: true },
        ],
      })
    ).toBeUndefined()
  })

  it("picks cheapest gross among in-stock active variants", () => {
    const id = pickCheapestInStockVariantId({
      variants: [
        { id: "expensive", netPrice: 10000, discount: 0, stock: 5, isActive: true },
        { id: "cheap", netPrice: 5000, discount: 0, stock: 2, isActive: true },
      ],
    })
    expect(id).toBe("cheap")
  })

  it("respects discount when comparing gross", () => {
    const id = pickCheapestInStockVariantId({
      variants: [
        { id: "highNetNoDisc", netPrice: 10000, discount: 0, stock: 1, isActive: true },
        { id: "lowerAfterDisc", netPrice: 10000, discount: 50, stock: 1, isActive: true },
      ],
    })
    expect(id).toBe("lowerAfterDisc")
  })
})

describe("shuffleInPlace", () => {
  it("mutates array in place and preserves length", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    const copy = [...arr]
    shuffleInPlace(arr)
    expect(arr.length).toBe(copy.length)
    expect(new Set(arr)).toEqual(new Set(copy))
  })
})

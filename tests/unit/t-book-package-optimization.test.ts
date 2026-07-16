import { describe, expect, it } from "vitest"
import { suggestPackageCombinations } from "@wse/plugin-t-book/lib/package-optimization"

const packages = [
  { key: "single", label: "Egyágyas", nights: 3, priceHuf: 100000, maxGuests: 1 },
  { key: "double", label: "Kétágyas", nights: 3, priceHuf: 150000, maxGuests: 2 },
]

describe("suggestPackageCombinations", () => {
  it("suggests three singles for 3 guests", () => {
    const suggestions = suggestPackageCombinations(3, packages)
    expect(suggestions.some((s) => s.units.single === 3)).toBe(true)
  })

  it("suggests double + single for 3 guests", () => {
    const suggestions = suggestPackageCombinations(3, packages)
    expect(
      suggestions.some((s) => s.units.double === 1 && s.units.single === 1)
    ).toBe(true)
  })
})

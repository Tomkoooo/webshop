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

  it("for 2 guests recommends 1 double or 2 singles (same night length)", () => {
    const suggestions = suggestPackageCombinations(2, packages)
    expect(suggestions.some((s) => s.units.double === 1 && !s.units.single)).toBe(true)
    expect(suggestions.some((s) => s.units.single === 2)).toBe(true)
    expect(suggestions[0]?.totalUnits).toBe(1)
  })

  it("does not mix packages with different night counts", () => {
    const mixedNights = [
      { key: "single2", label: "Single 2n", nights: 2, priceHuf: 100, maxGuests: 1 },
      { key: "double3", label: "Double 3n", nights: 3, priceHuf: 150, maxGuests: 2 },
    ]
    const suggestions = suggestPackageCombinations(2, mixedNights)
    for (const suggestion of suggestions) {
      const nightSet = new Set(
        Object.keys(suggestion.units).map(
          (key) => mixedNights.find((p) => p.key === key)?.nights
        )
      )
      expect(nightSet.size).toBe(1)
    }
  })
})

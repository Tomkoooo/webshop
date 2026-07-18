import { describe, expect, it } from "vitest"
import { packageUnitsFromSelections } from "../../packages/plugins/t-book/lib/package-inventory"
import type { TBookPackageDeal } from "../../packages/plugins/t-book/lib/pricing-types"

const packages: TBookPackageDeal[] = [
  { key: "single", label: "Single", nights: 2, priceHuf: 10000, maxGuests: 1, inventoryUnits: 10 },
  { key: "double", label: "Double", nights: 2, priceHuf: 15000, maxGuests: 2, inventoryUnits: 5 },
]

describe("packageUnitsFromSelections", () => {
  it("uses package_units when present", () => {
    expect(
      packageUnitsFromSelections(
        { package_units: { single: 2, double: 1 } },
        packages,
        4
      )
    ).toEqual({ single: 2, double: 1 })
  })

  it("derives units from package_deal and guest count", () => {
    expect(
      packageUnitsFromSelections({ package_deal: "double" }, packages, 4)
    ).toEqual({ double: 2 })
  })
})

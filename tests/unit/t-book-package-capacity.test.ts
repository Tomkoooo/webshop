import { describe, expect, it } from "vitest"
import {
  formatPackageDealCapacityLabel,
  packageUnitsForGuests,
} from "@wse/plugin-t-book/lib/hotel-pricing"

describe("packageUnitsForGuests", () => {
  it("returns 1 when maxGuests is unset", () => {
    expect(packageUnitsForGuests({ maxGuests: null }, 8)).toBe(1)
    expect(packageUnitsForGuests({}, 8)).toBe(1)
  })

  it("ceil-divides guests by maxGuests", () => {
    expect(packageUnitsForGuests({ maxGuests: 2 }, 4)).toBe(2)
    expect(packageUnitsForGuests({ maxGuests: 2 }, 5)).toBe(3)
    expect(packageUnitsForGuests({ maxGuests: 1 }, 4)).toBe(4)
  })
})

describe("formatPackageDealCapacityLabel", () => {
  it("describes required units when guests exceed capacity", () => {
    expect(formatPackageDealCapacityLabel({ maxGuests: 2 }, 4)).toBe(
      "2 csomag szükséges (4 fő, max 2 fő/csomag)"
    )
  })

  it("shows per-unit limit when guests fit", () => {
    expect(formatPackageDealCapacityLabel({ maxGuests: 2 }, 2)).toBe("Max 2 fő/csomag")
  })
})

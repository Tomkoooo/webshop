import { describe, expect, it } from "vitest"
import {
  filterAvailablePackages,
  isHotelPubliclyAvailable,
  packageUnitsFromSelections,
  remainingHotelBookingCapacity,
  remainingHotelRoomInventory,
  totalPackageUnits,
  withPackageRemainingUnits,
} from "../../packages/plugins/t-book/lib/package-inventory"
import type { TBookPackageDeal } from "../../packages/plugins/t-book/lib/pricing-types"

const packages: TBookPackageDeal[] = [
  { key: "single", label: "Single", nights: 2, priceHuf: 10000, maxGuests: 1, inventoryUnits: 10 },
  { key: "double", label: "Double", nights: 2, priceHuf: 15000, maxGuests: 2, inventoryUnits: 5 },
]

const unlimitedPackages: TBookPackageDeal[] = [
  { key: "single", label: "Single", nights: 2, priceHuf: 10000, maxGuests: 1 },
  { key: "double", label: "Double", nights: 2, priceHuf: 15000, maxGuests: 2 },
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

describe("hotel booking capacity helpers", () => {
  it("computes remaining hotel capacity", () => {
    expect(remainingHotelBookingCapacity(40, 12)).toBe(28)
    expect(remainingHotelBookingCapacity(10, 10)).toBe(0)
    expect(remainingHotelBookingCapacity(null, 5)).toBeNull()
  })

  it("computes shared room inventory remaining", () => {
    expect(remainingHotelRoomInventory(20, 7)).toBe(13)
    expect(remainingHotelRoomInventory(20, 20)).toBe(0)
    expect(remainingHotelRoomInventory(null, 3)).toBeNull()
    expect(totalPackageUnits({ single: 2, double: 3 })).toBe(5)
  })

  it("caps package remaining by shared hotel room pool", () => {
    const withShared = withPackageRemainingUnits(
      unlimitedPackages,
      { single: 4, double: 10 },
      6
    )
    expect(withShared.map((p) => p.remainingUnits)).toEqual([6, 6])

    const clamped = withPackageRemainingUnits(
      packages,
      { single: 8, double: 1 },
      3
    )
    // single: min(10-8, 3) = 2; double: min(5-1, 3) = 3
    expect(clamped.find((p) => p.key === "single")?.remainingUnits).toBe(2)
    expect(clamped.find((p) => p.key === "double")?.remainingUnits).toBe(3)
  })

  it("filters sold-out packages from the public list", () => {
    expect(
      filterAvailablePackages([
        { key: "a", remainingUnits: 2 },
        { key: "b", remainingUnits: 0 },
        { key: "c", remainingUnits: null },
      ]).map((p) => p.key)
    ).toEqual(["a", "c"])
  })

  it("hides packages-only hotels when all tracked packages are sold out", () => {
    expect(
      isHotelPubliclyAvailable({
        remainingCapacity: 5,
        accommodationMode: "packages",
        availablePackages: [],
        hadLimitedPackages: true,
      })
    ).toBe(false)

    expect(
      isHotelPubliclyAvailable({
        remainingCapacity: 0,
        accommodationMode: "both",
        availablePackages: [{ key: "a" }],
        hadLimitedPackages: false,
      })
    ).toBe(false)

    expect(
      isHotelPubliclyAvailable({
        remainingCapacity: null,
        remainingRoomInventory: 0,
        accommodationMode: "packages",
        availablePackages: [{ key: "a" }],
        hadLimitedPackages: false,
        hadRoomInventory: true,
      })
    ).toBe(false)

    expect(
      isHotelPubliclyAvailable({
        remainingCapacity: null,
        remainingRoomInventory: 5,
        accommodationMode: "packages",
        availablePackages: [],
        hadLimitedPackages: false,
        hadRoomInventory: true,
      })
    ).toBe(false)

    expect(
      isHotelPubliclyAvailable({
        remainingCapacity: null,
        accommodationMode: "room_nights",
        availablePackages: [],
        hadLimitedPackages: false,
      })
    ).toBe(true)
  })
})

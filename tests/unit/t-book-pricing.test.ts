import { describe, expect, it } from "vitest"
import {
  calculateAccommodationBaseHuf,
  calculateBookingQuote,
  isOptionApplicable,
  validateHotelSelections,
  validateSelections,
} from "@wse/plugin-t-book/lib/pricing"
import { flattenAddonOptions } from "@wse/plugin-t-book/lib/hotel-pricing"
import type {
  TBookAccommodationPricing,
  TBookOptionDef,
} from "@wse/plugin-t-book/lib/pricing-types"

const mealsOption: TBookOptionDef = {
  key: "meals",
  label: "Étkezés",
  type: "select",
  choices: [
    { value: "none", label: "Nincs", priceHuf: 0, priceMode: "fixed" },
    { value: "breakfast", label: "Csak reggeli", priceHuf: 2500, priceMode: "per_person_per_night" },
    { value: "half_board", label: "Fél panzió", priceHuf: 6000, priceMode: "per_person_per_night" },
  ],
}

const roomOption: TBookOptionDef = {
  key: "room_type",
  label: "Szobatípus",
  type: "select",
  required: true,
  choices: [
    { value: "standard", label: "Standard", priceHuf: 0, priceMode: "fixed" },
    { value: "suite", label: "Lakosztály", priceHuf: 15000, priceMode: "per_night" },
  ],
}

const accessibilityOption: TBookOptionDef = {
  key: "accessibility",
  label: "Akadálymentes",
  type: "checkbox",
  unitPriceHuf: 0,
  priceMode: "fixed",
  dependsOn: { key: "room_type", values: ["standard"] },
}

const extraBedOption: TBookOptionDef = {
  key: "extra_bed",
  label: "Pótágy",
  type: "number",
  min: 0,
  max: 2,
  unitPriceHuf: 4000,
  priceMode: "per_night",
}

const basePricing = {
  priceBasis: "gross" as const,
  vatPercent: 27,
  roomTypes: [
    { key: "standard", label: "Standard", baseRateHuf: 10000, sortOrder: 0 },
    { key: "suite", label: "Lakosztály", baseRateHuf: 15000, sortOrder: 1 },
  ],
  addonGroups: [
    {
      key: "services",
      label: "Szolgáltatások",
      sortOrder: 0,
      options: [mealsOption, accessibilityOption, extraBedOption],
    },
  ],
}

describe("accommodation base calculation", () => {
  it("per_person_per_night scales by guests × nights", () => {
    expect(calculateAccommodationBaseHuf(10000, "per_person_per_night", 2, 3)).toBe(60000)
  })
  it("per_night scales by nights only", () => {
    expect(calculateAccommodationBaseHuf(20000, "per_night", 4, 3)).toBe(60000)
  })
  it("per_person scales by guests only", () => {
    expect(calculateAccommodationBaseHuf(5000, "per_person", 3, 9)).toBe(15000)
  })
  it("per_booking is flat", () => {
    expect(calculateAccommodationBaseHuf(80000, "per_booking", 5, 7)).toBe(80000)
  })
  it("clamps negative rates to zero", () => {
    expect(calculateAccommodationBaseHuf(-500, "per_night", 1, 2)).toBe(0)
  })
})

describe("ticket-only booking (accommodation optional)", () => {
  it("total equals ticket fee × guests for per_person mode", () => {
    const quote = calculateBookingQuote({ ticketFeeHuf: 12000, guests: 3 })
    expect(quote.ticketSubtotalHuf).toBe(36000)
    expect(quote.accommodationSubtotalHuf).toBe(0)
    expect(quote.totalHuf).toBe(36000)
  })

  it("per_booking ticket fee ignores guest count", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 50000,
      ticketFeeMode: "per_booking",
      guests: 4,
    })
    expect(quote.totalHuf).toBe(50000)
  })

  it("guests are clamped to at least 1", () => {
    const quote = calculateBookingQuote({ ticketFeeHuf: 1000, guests: 0 })
    expect(quote.guests).toBe(1)
    expect(quote.totalHuf).toBe(1000)
  })
})

describe("booking quote with accommodation", () => {
  it("total = ticket + base + selected add-ons", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 10000,
      guests: 2,
      nights: 3,
      accommodation: basePricing,
      selections: { room_type: "suite", meals: "half_board" },
    })
    // ticket: 2 × 10 000 = 20 000
    expect(quote.ticketSubtotalHuf).toBe(20000)
    // suite base: 2 × 3 × 15 000 = 90 000
    expect(quote.accommodationBaseHuf).toBe(90000)
    // half board: 6 000 × 2 × 3 = 36 000
    expect(quote.accommodationOptionsHuf).toBe(36000)
    expect(quote.totalHuf).toBe(20000 + 90000 + 36000)
  })

  it("percent price mode scales from the accommodation base", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 2,
      nights: 2,
      accommodation: {
        priceBasis: "gross",
        vatPercent: 27,
        roomTypes: [{ key: "standard", label: "Standard", baseRateHuf: 10000 }],
        addonGroups: [
          {
            key: "extras",
            label: "Extrák",
            options: [
              {
                key: "peak",
                label: "Főszezon",
                type: "checkbox",
                unitPriceHuf: 10,
                priceMode: "percent",
              },
            ],
          },
        ],
      },
      selections: { room_type: "standard", peak: true },
    })
    // base 40 000, +10% = 4 000
    expect(quote.accommodationBaseHuf).toBe(40000)
    expect(quote.accommodationOptionsHuf).toBe(4000)
  })

  it("number options multiply unit price by quantity and mode", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 1,
      nights: 2,
      accommodation: basePricing,
      selections: { room_type: "standard", extra_bed: 2 },
    })
    // extra bed: 4 000 × 2 nights × 2 beds = 16 000
    expect(quote.lines.find((l) => l.key === "option:extra_bed")?.amountHuf).toBe(16000)
  })

  it("dependent options are skipped when the dependency does not match", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 1,
      nights: 1,
      accommodation: {
        ...basePricing,
        addonGroups: [
          {
            key: "services",
            label: "Szolgáltatások",
            options: [
              mealsOption,
              { ...accessibilityOption, unitPriceHuf: 9999, priceMode: "fixed" as const },
            ],
          },
        ],
      },
      selections: { room_type: "suite", accessibility: true },
    })
    expect(quote.lines.some((l) => l.key === "option:accessibility")).toBe(false)
  })

  it("multiselect sums all selected choices", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 2,
      nights: 1,
      accommodation: {
        priceBasis: "gross",
        vatPercent: 27,
        roomTypes: [{ key: "standard", label: "Standard", baseRateHuf: 0 }],
        addonGroups: [
          {
            key: "extras",
            label: "Extrák",
            options: [
              {
                key: "extras",
                label: "Extrák",
                type: "multiselect",
                choices: [
                  { value: "sauna", label: "Szauna", priceHuf: 3000, priceMode: "per_person" },
                  { value: "parking", label: "Parkolás", priceHuf: 2000, priceMode: "fixed" },
                ],
              },
            ],
          },
        ],
      },
      selections: { room_type: "standard", extras: ["sauna", "parking"] },
    })
    // sauna: 3 000 × 2 = 6 000; parking: 2 000
    expect(quote.accommodationOptionsHuf).toBe(8000)
  })

  it("uses default values when the customer does not select", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 1,
      nights: 1,
      accommodation: {
        priceBasis: "gross",
        vatPercent: 27,
        roomTypes: [{ key: "standard", label: "Standard", baseRateHuf: 0 }],
        addonGroups: [
          {
            key: "services",
            label: "Szolgáltatások",
            options: [{ ...mealsOption, defaultValue: "breakfast" }],
          },
        ],
      },
      selections: { room_type: "standard" },
    })
    expect(quote.accommodationOptionsHuf).toBe(2500)
  })

  it("nights are forced to at least 1 when accommodation is selected", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 1,
      nights: 0,
      accommodation: basePricing,
      selections: { room_type: "standard" },
    })
    expect(quote.nights).toBe(1)
    expect(quote.accommodationBaseHuf).toBe(10000)
  })
})

describe("selection validation", () => {
  const addonOptions = flattenAddonOptions(basePricing)

  it("accepts a valid selection set", () => {
    expect(
      validateHotelSelections(basePricing, {
        room_type: "standard",
        meals: "breakfast",
        extra_bed: 1,
      })
    ).toEqual([])
  })

  it("rejects unknown option keys", () => {
    const errors = validateHotelSelections(basePricing, {
      room_type: "standard",
      hacked: "1",
    })
    expect(errors.some((e) => e.key === "hacked")).toBe(true)
  })

  it("rejects missing room type", () => {
    const errors = validateHotelSelections(basePricing, { meals: "breakfast" })
    expect(errors.some((e) => e.key === "room_type")).toBe(true)
  })

  it("rejects unknown room type", () => {
    const errors = validateHotelSelections(basePricing, { room_type: "penthouse" })
    expect(errors.some((e) => e.key === "room_type")).toBe(true)
  })

  it("rejects numbers outside min/max", () => {
    const errors = validateHotelSelections(basePricing, {
      room_type: "standard",
      extra_bed: 5,
    })
    expect(errors.some((e) => e.key === "extra_bed")).toBe(true)
  })

  it("skips validation of inapplicable dependent options", () => {
    const errors = validateSelections(
      [roomOption, { ...accessibilityOption, required: true }],
      { room_type: "suite" }
    )
    expect(errors).toEqual([])
  })
})

describe("isOptionApplicable", () => {
  it("is true without a dependency", () => {
    expect(isOptionApplicable(mealsOption, {})).toBe(true)
  })
  it("matches dependency values", () => {
    expect(isOptionApplicable(accessibilityOption, { room_type: "standard" })).toBe(true)
    expect(isOptionApplicable(accessibilityOption, { room_type: "suite" })).toBe(false)
    expect(isOptionApplicable(accessibilityOption, {})).toBe(false)
  })
})

const packageOnlyPricing = {
  priceBasis: "gross" as const,
  vatPercent: 27,
  accommodationMode: "packages" as const,
  roomTypes: [],
  packages: [
    { key: "single_3n", label: "3 éj egyágyas", nights: 3, priceHuf: 120000, maxGuests: 1, sortOrder: 0 },
    { key: "double_3n", label: "3 éj kétágyas", nights: 3, priceHuf: 150000, maxGuests: 2, sortOrder: 1 },
  ],
  extrasSection: null,
}

describe("package-only accommodation", () => {
  it("requires package selection without room types", () => {
    const errors = validateHotelSelections(packageOnlyPricing, {})
    expect(errors.some((e) => e.key === "package_deal")).toBe(true)
    expect(errors.some((e) => e.key === "room_type")).toBe(false)
  })

  it("accepts valid package selection", () => {
    const errors = validateHotelSelections(packageOnlyPricing, {
      package_deal: "single_3n",
    })
    expect(errors).toEqual([])
  })

  it("does not treat package_deal as unknown option", () => {
    const errors = validateHotelSelections(basePricing, {
      room_type: "standard",
      package_deal: "weekend",
    })
    expect(errors.some((e) => e.message.includes("Ismeretlen opció"))).toBe(false)
  })

  it("quotes flat package price without maxGuests (legacy flat rate)", () => {
    const legacyPricing = {
      ...packageOnlyPricing,
      packages: [{ key: "flat", label: "Flat csomag", nights: 3, priceHuf: 120000 }],
    }
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 4,
      nights: 3,
      accommodation: legacyPricing,
      selections: { package_deal: "flat" },
    })
    expect(quote.accommodationBaseHuf).toBe(120000)
  })

  it("multiplies package price by required units when maxGuests is set", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 4,
      nights: 3,
      accommodation: packageOnlyPricing,
      selections: { package_deal: "double_3n" },
    })
    expect(quote.accommodationBaseHuf).toBe(300000)
    expect(quote.lines.find((l) => l.key === "accommodation_base")?.label).toBe("3 éj kétágyas × 2")
  })

  it("uses one package unit when guests fit maxGuests", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      guests: 2,
      nights: 3,
      accommodation: packageOnlyPricing,
      selections: { package_deal: "double_3n" },
    })
    expect(quote.accommodationBaseHuf).toBe(150000)
    expect(quote.lines.find((l) => l.key === "accommodation_base")?.label).toBe("3 éj kétágyas")
  })
})

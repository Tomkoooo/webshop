import { describe, expect, it } from "vitest"
import { calculateBookingQuote } from "@wse/plugin-t-book/lib/pricing"
import type { TBookAccommodationPricing } from "@wse/plugin-t-book/lib/pricing-types"

const roomHotel: TBookAccommodationPricing = {
  priceBasis: "gross",
  vatPercent: 27,
  accommodationMode: "room_nights",
  roomTypes: [
    { key: "standard", label: "Standard", baseRateHuf: 10000, sortOrder: 0 },
    { key: "suite", label: "Suite", baseRateHuf: 15000, sortOrder: 1 },
  ],
  packages: [],
  addonGroups: [],
}

const packageHotel: TBookAccommodationPricing = {
  priceBasis: "gross",
  vatPercent: 27,
  accommodationMode: "packages",
  roomTypes: [],
  packages: [
    {
      key: "double",
      label: "Double package",
      nights: 2,
      priceHuf: 40000,
      maxGuests: 2,
      sortOrder: 0,
    },
  ],
  addonGroups: [],
}

type MatrixRow = {
  id: string
  guests: number
  accommodationGuests?: number
  nights: number
  accommodation: TBookAccommodationPricing | null
  selections?: Record<string, string | number | boolean | Record<string, number>>
  ticketFeeHuf?: number
  ticketFeeMode?: "per_person" | "per_booking" | "per_team"
  expectTotal: number
  expectLineKeys: string[]
}

const MATRIX: MatrixRow[] = [
  {
    id: "entry-only-1",
    guests: 1,
    nights: 0,
    accommodation: null,
    ticketFeeHuf: 4000,
    ticketFeeMode: "per_person",
    expectTotal: 4000,
    expectLineKeys: ["ticket"],
  },
  {
    id: "entry-only-3-per-person",
    guests: 3,
    nights: 0,
    accommodation: null,
    ticketFeeHuf: 4000,
    ticketFeeMode: "per_person",
    expectTotal: 12000,
    expectLineKeys: ["ticket"],
  },
  {
    id: "entry-per-booking",
    guests: 5,
    nights: 0,
    accommodation: null,
    ticketFeeHuf: 9000,
    ticketFeeMode: "per_booking",
    expectTotal: 9000,
    expectLineKeys: ["ticket"],
  },
  {
    id: "room-2g-2n-standard",
    guests: 2,
    accommodationGuests: 2,
    nights: 2,
    accommodation: roomHotel,
    selections: { room_type: "standard" },
    ticketFeeHuf: 4000,
    ticketFeeMode: "per_person",
    expectTotal: 4000 * 2 + 10000 * 2 * 2,
    expectLineKeys: ["ticket", "accommodation_base"],
  },
  {
    id: "room-partial-hotel",
    guests: 3,
    accommodationGuests: 1,
    nights: 2,
    accommodation: roomHotel,
    selections: { room_type: "suite" },
    ticketFeeHuf: 4000,
    ticketFeeMode: "per_person",
    expectTotal: 4000 * 3 + 15000 * 1 * 2,
    expectLineKeys: ["ticket", "accommodation_base"],
  },
  {
    id: "package-2-guests",
    guests: 2,
    accommodationGuests: 2,
    nights: 2,
    accommodation: packageHotel,
    selections: { package_deal: "double" },
    ticketFeeHuf: 4000,
    ticketFeeMode: "per_person",
    expectTotal: 4000 * 2 + 40000,
    expectLineKeys: ["ticket", "accommodation_base"],
  },
]

describe("t-book booking quote matrix", () => {
  it.each(MATRIX)(
    "$id → total $expectTotal",
    ({
      guests,
      accommodationGuests,
      nights,
      accommodation,
      selections,
      ticketFeeHuf = 4000,
      ticketFeeMode = "per_person",
      expectTotal,
      expectLineKeys,
    }) => {
      const quote = calculateBookingQuote({
        ticketFeeHuf,
        ticketFeeMode,
        ticketPriceBasis: "gross",
        ticketVatPercent: 27,
        guests,
        accommodationGuests: accommodationGuests ?? guests,
        nights,
        accommodation,
        groupOptions: [],
        selections: selections ?? {},
      })

      expect(quote.totalHuf).toBe(expectTotal)
      for (const key of expectLineKeys) {
        expect(quote.lines.some((line) => line.key === key)).toBe(true)
      }
      expect(quote.lines.find((line) => line.key === "ticket")?.label).toMatch(/^Entry/)
    }
  )
})

import { describe, expect, it } from "vitest"
import {
  buildLiveMultiQuoteMatrix,
  buildLiveQuoteMatrix,
  type EventHotelBundle,
} from "../helpers/t-book-live-matrix"
import type { TBookPublicEvent, TBookPublicHotel } from "@wse/plugin-t-book/storefront/tbook-public-api"

function event(partial: Partial<TBookPublicEvent> & { id: string; name: string }): TBookPublicEvent {
  return {
    description: "",
    location: { address: "" },
    startDate: "2026-01-01",
    endDate: "2026-01-02",
    nights: 1,
    ticketFeeHuf: 30,
    ticketFeeMode: "per_person",
    currency: "EUR",
    heroImage: "",
    attendeeFieldSchema: [],
    ...partial,
  }
}

function hotel(partial: Partial<TBookPublicHotel> & { id: string; name: string }): TBookPublicHotel {
  return {
    description: "",
    address: "",
    distanceFromVenueKm: null,
    gallery: [],
    currency: "EUR",
    pricing: {
      priceBasis: "gross",
      vatPercent: 27,
      accommodationMode: "both",
      roomTypes: [{ key: "standard", label: "Standard", baseRateHuf: 40, sortOrder: 0 }],
      packages: [{ key: "double", label: "Double", nights: 2, priceHuf: 100, maxGuests: 2, sortOrder: 0 }],
      addonGroups: [],
    },
    ...partial,
  }
}

describe("buildLiveQuoteMatrix lodging scopes", () => {
  const bundles: EventHotelBundle[] = [
    {
      event: event({ id: "e1", name: "Open" }),
      hotels: [hotel({ id: "h1", name: "Hotel A" })],
    },
  ]

  it("includes entry-only, full-group hotel, and partial-group hotel rows", () => {
    const matrix = buildLiveQuoteMatrix(bundles)
    expect(matrix.some((row) => row.lodgingScope === "none")).toBe(true)
    expect(matrix.some((row) => row.lodgingScope === "full_group" && row.accommodationGuests === row.guests)).toBe(
      true
    )
    expect(
      matrix.some(
        (row) =>
          row.lodgingScope === "partial_group" &&
          (row.accommodationGuests ?? 0) > 0 &&
          (row.accommodationGuests ?? 0) < row.guests
      )
    ).toBe(true)
  })
})

describe("buildLiveMultiQuoteMatrix", () => {
  const bundles: EventHotelBundle[] = [
    {
      event: event({ id: "e1", name: "Open" }),
      hotels: [hotel({ id: "h1", name: "Hotel A" })],
    },
    {
      event: event({ id: "e2", name: "Masters" }),
      hotels: [hotel({ id: "h2", name: "Hotel B" })],
    },
  ]

  it("covers multi entry-only, combined shared hotel, and separate per-event hotels", () => {
    const matrix = buildLiveMultiQuoteMatrix(bundles)
    expect(matrix.some((row) => row.kind === "multi_entry_only")).toBe(true)
    expect(matrix.some((row) => row.kind === "multi_combined_hotel" && row.lodgingMode === "combined")).toBe(
      true
    )
    expect(
      matrix.some(
        (row) =>
          row.kind === "multi_separate_hotels" &&
          row.lodgingMode === "separate" &&
          row.entries.filter((entry) => entry.hotelId).length >= 2
      )
    ).toBe(true)
  })
})

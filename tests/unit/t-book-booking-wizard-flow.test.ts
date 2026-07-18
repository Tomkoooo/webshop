import { describe, expect, it } from "vitest"
import {
  canProceedBookingStep,
  isStep1Valid,
  isStep2Valid,
  resolveHotelStayPhase,
} from "@wse/plugin-t-book/lib/booking-wizard-flow"

describe("resolveHotelStayPhase", () => {
  it("stays on stay_choice until hotel is requested", () => {
    expect(
      resolveHotelStayPhase({ hotelCount: 2, wantsHotel: null, selectedHotelId: null })
    ).toBe("stay_choice")
    expect(
      resolveHotelStayPhase({ hotelCount: 2, wantsHotel: false, selectedHotelId: null })
    ).toBe("stay_choice")
  })

  it("moves to pick_hotel then configure_rooms", () => {
    expect(
      resolveHotelStayPhase({ hotelCount: 2, wantsHotel: true, selectedHotelId: null })
    ).toBe("pick_hotel")
    expect(
      resolveHotelStayPhase({
        hotelCount: 2,
        wantsHotel: true,
        selectedHotelId: "h1",
      })
    ).toBe("configure_rooms")
  })
})

describe("booking step validation matrix", () => {
  const base = {
    guests: 1,
    hotelCount: 2,
    wantsHotel: false as boolean | null,
    selectedHotelId: null as string | null,
    accommodationNeed: "none" as const,
    accommodationGuests: 0,
    attendeesValid: true,
    customerValid: true,
    hasQuote: true,
  }

  const cases: Array<{
    id: string
    patch: Partial<typeof base> & { step: number }
    expected: boolean
  }> = [
    { id: "s1-zero-guests", patch: { step: 1, guests: 0 }, expected: false },
    { id: "s1-one-guest", patch: { step: 1, guests: 1 }, expected: true },
    {
      id: "s2-undecided",
      patch: { step: 2, wantsHotel: null },
      expected: false,
    },
    {
      id: "s2-entry-only",
      patch: { step: 2, wantsHotel: false },
      expected: true,
    },
    {
      id: "s2-hotel-no-selection",
      patch: { step: 2, wantsHotel: true, selectedHotelId: null, accommodationNeed: "all" },
      expected: false,
    },
    {
      id: "s2-hotel-selected",
      patch: {
        step: 2,
        wantsHotel: true,
        selectedHotelId: "h1",
        accommodationNeed: "all",
        accommodationGuests: 1,
      },
      expected: true,
    },
    {
      id: "s2-some-zero",
      patch: {
        step: 2,
        wantsHotel: true,
        selectedHotelId: "h1",
        accommodationNeed: "some",
        accommodationGuests: 0,
      },
      expected: false,
    },
    { id: "s3-attendees-bad", patch: { step: 3, attendeesValid: false }, expected: false },
    { id: "s3-attendees-ok", patch: { step: 3, attendeesValid: true }, expected: true },
    { id: "s4-customer-bad", patch: { step: 4, customerValid: false }, expected: false },
    { id: "s4-customer-ok", patch: { step: 4, customerValid: true }, expected: true },
    { id: "s5-no-quote", patch: { step: 5, hasQuote: false }, expected: false },
    { id: "s5-quote", patch: { step: 5, hasQuote: true }, expected: true },
  ]

  it.each(cases)("$id → $expected", ({ patch, expected }) => {
    expect(canProceedBookingStep({ ...base, ...patch })).toBe(expected)
  })

  it("isStep1Valid / isStep2Valid helpers match matrix edges", () => {
    expect(isStep1Valid(0)).toBe(false)
    expect(isStep1Valid(2)).toBe(true)
    expect(
      isStep2Valid({
        hotelCount: 0,
        wantsHotel: null,
        selectedHotelId: null,
        accommodationNeed: "none",
        accommodationGuests: 0,
      })
    ).toBe(true)
  })
})

import { describe, expect, it } from "vitest"
import {
  canProceedBookingStep,
  isStep1Valid,
  isStep2Valid,
  isStep3RoomsValid,
  nextWizardStep,
  prevWizardStep,
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

describe("wizard step skip helpers", () => {
  it("skips rooms when entry-only", () => {
    expect(nextWizardStep(2, false, 2)).toBe(4)
    expect(prevWizardStep(4, false, 2)).toBe(2)
  })

  it("enters rooms when hotel selected", () => {
    expect(nextWizardStep(2, true, 2)).toBe(3)
    expect(prevWizardStep(4, true, 2)).toBe(3)
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
      patch: { step: 2, wantsHotel: true, selectedHotelId: null },
      expected: false,
    },
    {
      id: "s2-hotel-selected",
      patch: {
        step: 2,
        wantsHotel: true,
        selectedHotelId: "h1",
      },
      expected: true,
    },
    {
      id: "s3-rooms-some-zero",
      patch: {
        step: 3,
        wantsHotel: true,
        selectedHotelId: "h1",
        accommodationNeed: "some",
        accommodationGuests: 0,
      },
      expected: false,
    },
    {
      id: "s3-rooms-ok",
      patch: {
        step: 3,
        wantsHotel: true,
        selectedHotelId: "h1",
        accommodationNeed: "all",
        accommodationGuests: 1,
      },
      expected: true,
    },
    { id: "s4-attendees-bad", patch: { step: 4, attendeesValid: false }, expected: false },
    { id: "s4-attendees-ok", patch: { step: 4, attendeesValid: true }, expected: true },
    { id: "s5-customer-bad", patch: { step: 5, customerValid: false }, expected: false },
    { id: "s5-customer-ok", patch: { step: 5, customerValid: true }, expected: true },
    { id: "s6-no-quote", patch: { step: 6, hasQuote: false }, expected: false },
    { id: "s6-quote", patch: { step: 6, hasQuote: true }, expected: true },
  ]

  it.each(cases)("$id → $expected", ({ patch, expected }) => {
    expect(canProceedBookingStep({ ...base, ...patch })).toBe(expected)
  })

  it("validates step helpers", () => {
    expect(isStep1Valid(1)).toBe(true)
    expect(isStep2Valid({ hotelCount: 0, wantsHotel: null, selectedHotelId: null })).toBe(true)
    expect(
      isStep3RoomsValid({
        hotelCount: 2,
        wantsHotel: true,
        selectedHotelId: "h1",
        accommodationNeed: "all",
        accommodationGuests: 1,
      })
    ).toBe(true)
  })
})

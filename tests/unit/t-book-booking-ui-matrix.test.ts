import { describe, expect, it } from "vitest"
import {
  canProceedBookingStep,
  resolveHotelStayPhase,
  type HotelStayPhase,
} from "@wse/plugin-t-book/lib/booking-wizard-flow"

/**
 * UI matrix: hotel step = stay choice + hotel pick; rooms step validates headcount.
 */
type UiCase = {
  id: string
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
  accommodationNeed: "none" | "all" | "some"
  accommodationGuests: number
  expectedPhase: HotelStayPhase
  canContinueStep2: boolean
  canContinueStep3: boolean
}

const UI_MATRIX: UiCase[] = [
  {
    id: "no-hotels",
    hotelCount: 0,
    wantsHotel: null,
    selectedHotelId: null,
    accommodationNeed: "none",
    accommodationGuests: 0,
    expectedPhase: "stay_choice",
    canContinueStep2: true,
    canContinueStep3: true,
  },
  {
    id: "undecided",
    hotelCount: 3,
    wantsHotel: null,
    selectedHotelId: null,
    accommodationNeed: "none",
    accommodationGuests: 0,
    expectedPhase: "stay_choice",
    canContinueStep2: false,
    canContinueStep3: true,
  },
  {
    id: "entry-only",
    hotelCount: 3,
    wantsHotel: false,
    selectedHotelId: null,
    accommodationNeed: "none",
    accommodationGuests: 0,
    expectedPhase: "stay_choice",
    canContinueStep2: true,
    canContinueStep3: true,
  },
  {
    id: "wants-hotel-not-picked",
    hotelCount: 3,
    wantsHotel: true,
    selectedHotelId: null,
    accommodationNeed: "all",
    accommodationGuests: 2,
    expectedPhase: "pick_hotel",
    canContinueStep2: false,
    canContinueStep3: false,
  },
  {
    id: "hotel-picked-everyone",
    hotelCount: 3,
    wantsHotel: true,
    selectedHotelId: "hotel-a",
    accommodationNeed: "all",
    accommodationGuests: 2,
    expectedPhase: "configure_rooms",
    canContinueStep2: true,
    canContinueStep3: true,
  },
  {
    id: "hotel-picked-some-ok",
    hotelCount: 3,
    wantsHotel: true,
    selectedHotelId: "hotel-a",
    accommodationNeed: "some",
    accommodationGuests: 1,
    expectedPhase: "configure_rooms",
    canContinueStep2: true,
    canContinueStep3: true,
  },
  {
    id: "hotel-picked-some-zero",
    hotelCount: 3,
    wantsHotel: true,
    selectedHotelId: "hotel-a",
    accommodationNeed: "some",
    accommodationGuests: 0,
    expectedPhase: "configure_rooms",
    canContinueStep2: true,
    canContinueStep3: false,
  },
]

describe("t-book booking UI matrix", () => {
  it.each(UI_MATRIX)(
    "$id → phase $expectedPhase, s2=$canContinueStep2, s3=$canContinueStep3",
    (row) => {
      expect(
        resolveHotelStayPhase({
          hotelCount: row.hotelCount,
          wantsHotel: row.wantsHotel,
          selectedHotelId: row.selectedHotelId,
        })
      ).toBe(row.expectedPhase)

      const shared = {
        guests: 2,
        hotelCount: row.hotelCount,
        wantsHotel: row.wantsHotel,
        selectedHotelId: row.selectedHotelId,
        accommodationNeed: row.accommodationNeed,
        accommodationGuests: row.accommodationGuests,
        attendeesValid: true,
        customerValid: true,
        hasQuote: false,
      }

      expect(canProceedBookingStep({ ...shared, step: 2 })).toBe(row.canContinueStep2)
      expect(canProceedBookingStep({ ...shared, step: 3 })).toBe(row.canContinueStep3)
    }
  )
})

import { describe, expect, it } from "vitest"
import {
  canProceedBookingStep,
  resolveHotelStayPhase,
  type HotelStayPhase,
} from "@wse/plugin-t-book/lib/booking-wizard-flow"

/**
 * UI matrix: every meaningful hotel-step combination and whether Continue unlocks.
 * Mirrors the progressive stay → hotel → room disclosure in TBookBookingWizard.
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
  },
  {
    id: "hotel-picked-some-zero",
    hotelCount: 3,
    wantsHotel: true,
    selectedHotelId: "hotel-a",
    accommodationNeed: "some",
    accommodationGuests: 0,
    expectedPhase: "configure_rooms",
    canContinueStep2: false,
  },
]

describe("t-book booking UI matrix", () => {
  it.each(UI_MATRIX)(
    "$id → phase $expectedPhase, continue=$canContinueStep2",
    (row) => {
      expect(
        resolveHotelStayPhase({
          hotelCount: row.hotelCount,
          wantsHotel: row.wantsHotel,
          selectedHotelId: row.selectedHotelId,
        })
      ).toBe(row.expectedPhase)

      expect(
        canProceedBookingStep({
          step: 2,
          guests: 2,
          hotelCount: row.hotelCount,
          wantsHotel: row.wantsHotel,
          selectedHotelId: row.selectedHotelId,
          accommodationNeed: row.accommodationNeed,
          accommodationGuests: row.accommodationGuests,
          attendeesValid: true,
          customerValid: true,
          hasQuote: false,
        })
      ).toBe(row.canContinueStep2)
    }
  )
})

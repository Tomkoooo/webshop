/**
 * Pure helpers for the single-event booking wizard — used by the UI and matrix tests.
 */

export type StayChoice = "entry_only" | "hotel" | null

export type HotelStayPhase = "stay_choice" | "pick_hotel" | "configure_rooms"

export function resolveHotelStayPhase(input: {
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
}): HotelStayPhase {
  if (input.hotelCount === 0) return "stay_choice"
  if (input.wantsHotel !== true) return "stay_choice"
  if (!input.selectedHotelId) return "pick_hotel"
  return "configure_rooms"
}

export function isStep1Valid(guests: number): boolean {
  return Number.isFinite(guests) && guests >= 1
}

export function isStep2Valid(input: {
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
  accommodationNeed: "none" | "all" | "some"
  accommodationGuests: number
}): boolean {
  if (input.hotelCount === 0) return true
  if (input.wantsHotel === null) return false
  if (input.wantsHotel === false) return true
  if (!input.selectedHotelId) return false
  if (input.accommodationNeed === "some" && input.accommodationGuests < 1) return false
  return true
}

export function canProceedBookingStep(input: {
  step: number
  guests: number
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
  accommodationNeed: "none" | "all" | "some"
  accommodationGuests: number
  attendeesValid: boolean
  customerValid: boolean
  hasQuote: boolean
}): boolean {
  switch (input.step) {
    case 1:
      return isStep1Valid(input.guests)
    case 2:
      return isStep2Valid(input)
    case 3:
      return input.attendeesValid
    case 4:
      return input.customerValid
    case 5:
      return input.hasQuote
    default:
      return false
  }
}

/** Matrix row describing an expected booking path outcome. */
export type BookingPathCase = {
  id: string
  guests: number
  wantsHotel: boolean
  hotelId: string | null
  nights: number | null
  roomTypeKey?: string
  packageDealKey?: string
  expect: "quote_ok" | "quote_error" | "validation_error"
  errorIncludes?: string
}

export const BOOKING_PATH_MATRIX: BookingPathCase[] = [
  {
    id: "entry-only-1",
    guests: 1,
    wantsHotel: false,
    hotelId: null,
    nights: null,
    expect: "quote_ok",
  },
  {
    id: "entry-only-3",
    guests: 3,
    wantsHotel: false,
    hotelId: null,
    nights: null,
    expect: "quote_ok",
  },
  {
    id: "hotel-missing-id",
    guests: 1,
    wantsHotel: true,
    hotelId: null,
    nights: 2,
    expect: "validation_error",
  },
  {
    id: "hotel-with-room",
    guests: 2,
    wantsHotel: true,
    hotelId: "__live__",
    nights: 2,
    roomTypeKey: "__live__",
    expect: "quote_ok",
  },
  {
    id: "hotel-invalid-id",
    guests: 1,
    wantsHotel: true,
    hotelId: "000000000000000000000000",
    nights: 1,
    expect: "quote_error",
    errorIncludes: "Hotel not found",
  },
]

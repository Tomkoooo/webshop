/**
 * Pure helpers for the single-event booking wizard — used by the UI and matrix tests.
 */

export type StayChoice = "entry_only" | "hotel" | null

export type HotelStayPhase = "stay_choice" | "pick_hotel" | "configure_rooms"

export const SINGLE_WIZARD_STEPS = [
  "Entries",
  "Hotel",
  "Rooms",
  "Players",
  "Your details",
  "Review",
] as const

export const SINGLE_WIZARD_TOTAL_STEPS = SINGLE_WIZARD_STEPS.length
/** Step index (1-based) where Continue becomes “Review quote”. */
export const SINGLE_WIZARD_REVIEW_STEP = 5

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

/** Hotel step: stay choice + hotel pick (rooms are a separate step). */
export function isStep2Valid(input: {
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
}): boolean {
  if (input.hotelCount === 0) return true
  if (input.wantsHotel === null) return false
  if (input.wantsHotel === false) return true
  return Boolean(input.selectedHotelId)
}

/** Rooms step: who needs a room + package/room selection readiness. */
export function isStep3RoomsValid(input: {
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
  accommodationNeed: "none" | "all" | "some"
  accommodationGuests: number
  packagesRequired?: boolean
  hasPackageSelection?: boolean
  roomsRequired?: boolean
  hasRoomSelection?: boolean
}): boolean {
  if (input.hotelCount === 0 || input.wantsHotel !== true) return true
  if (!input.selectedHotelId) return false
  if (input.accommodationNeed === "some" && input.accommodationGuests < 1) return false
  if (input.accommodationNeed === "none") return false
  if (input.packagesRequired && !input.hasPackageSelection) return false
  if (input.roomsRequired && !input.hasRoomSelection) return false
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
  packagesRequired?: boolean
  hasPackageSelection?: boolean
  roomsRequired?: boolean
  hasRoomSelection?: boolean
}): boolean {
  switch (input.step) {
    case 1:
      return isStep1Valid(input.guests)
    case 2:
      return isStep2Valid(input)
    case 3:
      return isStep3RoomsValid(input)
    case 4:
      return input.attendeesValid
    case 5:
      return input.customerValid
    case 6:
      return input.hasQuote
    default:
      return false
  }
}

/** Skip the Rooms step when the guest chose entry-only (or there are no hotels). */
export function nextWizardStep(step: number, wantsHotel: boolean | null, hotelCount: number): number {
  if (step === 2 && (hotelCount === 0 || wantsHotel !== true)) return 4
  return Math.min(step + 1, SINGLE_WIZARD_TOTAL_STEPS)
}

export function prevWizardStep(step: number, wantsHotel: boolean | null, hotelCount: number): number {
  if (step === 4 && (hotelCount === 0 || wantsHotel !== true)) return 2
  return Math.max(step - 1, 1)
}

/** Multi-event stay mode shown in the lodging UI (clusters are not a primary path). */
export type MultiLodgingMode = "separate" | "combined"

export type MultiWizardStepDef =
  | { kind: "entries"; label: string }
  | { kind: "hotel"; label: string; eventId: string | null }
  | { kind: "rooms"; label: string; eventId: string | null }
  | { kind: "players"; label: string }
  | { kind: "details"; label: string }
  | { kind: "review"; label: string }

/**
 * Build the multi-booking wizard step list.
 * Separate mode: Hotel/Rooms per event; combined: one Hotel then optional Rooms.
 */
export function buildMultiWizardSteps(input: {
  lodgingMode: MultiLodgingMode
  events: Array<{ id: string; name: string }>
  wantsHotelByEventId: Record<string, boolean | null>
  wantsHotelCombined: boolean | null
  hotelCount: number
}): MultiWizardStepDef[] {
  const steps: MultiWizardStepDef[] = [{ kind: "entries", label: "Entries" }]

  if (input.hotelCount > 0) {
    if (input.lodgingMode === "combined") {
      steps.push({ kind: "hotel", label: "Hotel", eventId: null })
      if (input.wantsHotelCombined === true) {
        steps.push({ kind: "rooms", label: "Rooms", eventId: null })
      }
    } else {
      for (const event of input.events) {
        steps.push({
          kind: "hotel",
          label: `Hotel · ${event.name}`,
          eventId: event.id,
        })
        if (input.wantsHotelByEventId[event.id] === true) {
          steps.push({
            kind: "rooms",
            label: `Rooms · ${event.name}`,
            eventId: event.id,
          })
        }
      }
    }
  }

  steps.push({ kind: "players", label: "Players" })
  steps.push({ kind: "details", label: "Your details" })
  steps.push({ kind: "review", label: "Review" })
  return steps
}

/** Prefer matching by kind + eventId when the step list shrinks (e.g. wantsHotel → false). */
export function matchMultiWizardStepIndex(
  steps: MultiWizardStepDef[],
  previous: MultiWizardStepDef | undefined,
  fallbackIndex1Based: number
): number {
  if (steps.length === 0) return 1
  if (previous) {
    const exact = steps.findIndex((s) => {
      if (s.kind !== previous.kind) return false
      if (s.kind === "hotel" || s.kind === "rooms") {
        return (
          previous.kind === s.kind &&
          s.eventId === (previous as { eventId: string | null }).eventId
        )
      }
      return true
    })
    if (exact >= 0) return exact + 1

    // Rooms step removed (chose entry-only): stay on that event's hotel step
    if (previous.kind === "rooms") {
      const hotelIdx = steps.findIndex(
        (s) => s.kind === "hotel" && s.eventId === previous.eventId
      )
      if (hotelIdx >= 0) return hotelIdx + 1
    }

    // Lodging mode switch: jump to the first hotel step (or players if none)
    if (previous.kind === "hotel" || previous.kind === "rooms") {
      const firstHotel = steps.findIndex((s) => s.kind === "hotel")
      if (firstHotel >= 0) return firstHotel + 1
      const players = steps.findIndex((s) => s.kind === "players")
      if (players >= 0) return players + 1
    }
  }
  return Math.min(Math.max(1, fallbackIndex1Based), steps.length)
}

export function isMultiHotelStepValid(input: {
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
}): boolean {
  return isStep2Valid(input)
}

export function isMultiRoomsStepValid(input: {
  hotelCount: number
  wantsHotel: boolean | null
  selectedHotelId: string | null
  accommodationNeed: "none" | "all" | "some"
  accommodationGuests: number
  packagesRequired?: boolean
  hasPackageSelection?: boolean
  roomsRequired?: boolean
  hasRoomSelection?: boolean
}): boolean {
  return isStep3RoomsValid(input)
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

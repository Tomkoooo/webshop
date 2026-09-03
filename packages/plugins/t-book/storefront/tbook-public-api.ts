import { normalizeTBookApiKey, TBOOK_API_KEY_HEADER } from "../lib/api-key"
import { DEFAULT_TBOOK_CURRENCY, formatTBookMoney } from "../lib/currency"
import { TBOOK_SAME_ORIGIN_API_BASE } from "../lib/tbook-api-base"
import type { TBookHotelPricing, TBookOptionDef } from "../lib/pricing-types"

export { resolveTBookServerApiBase, TBOOK_SAME_ORIGIN_API_BASE } from "../lib/tbook-api-base"

import type { TBookEligibilityRulesConfig } from "../lib/eligibility"

export type TBookPublicAttendeeFieldDef = {
  key: string
  label: string
  type: "text" | "email" | "phone" | "number" | "date" | "select"
  required?: boolean
  helpText?: string
  choices?: { value: string; label: string }[]
  min?: number
  max?: number
}

export type TBookPublicEvent = {
  id: string
  name: string
  description: string
  location: { address?: string; lat?: number | null; lng?: number | null }
  startDate: string
  endDate: string
  startTime?: string | null
  endTime?: string | null
  salesOpensAt?: string | Date | null
  salesClosesAt?: string | Date | null
  nights: number
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking" | "per_team"
  registrationUnit?: "person" | "team"
  playersPerTicket?: number
  teamMemberLimit?: number | null
  teamMemberFieldSchema?: TBookPublicAttendeeFieldDef[]
  currency?: string
  heroImage: string
  attendeeFieldSchema: TBookPublicAttendeeFieldDef[]
  /** Entry rules — used for inline storefront validation before payment. */
  eligibilityPreset?: string
  eligibilityMinAge?: number | null
  eligibilityMaxAge?: number | null
  eligibilityAllowedGenders?: string[] | null
  eligibilityBirthDateFieldKey?: string | null
  eligibilityGenderFieldKey?: string | null
  eligibilityFormRules?: TBookEligibilityRulesConfig | null
  /** Present when the org has linked this event to a live tDarts tournament. */
  tdarts?: TBookPublicTDartsInfo | null
  /** When true (and no tDarts link), the event has a public read-only entry list. */
  publicEntryList?: boolean
}

/** Browser-safe pointer to tDarts' embed API — no secret (origin-allowlisted). */
export type TBookPublicTDartsInfo = {
  tournamentCode: string
  apiBaseUrl: string
  embedClientId: string
}

export type TBookPublicOptionDef = TBookOptionDef

export type TBookPublicRoomType = TBookHotelPricing["roomTypes"][number]

export type TBookPublicPackageDeal = NonNullable<TBookHotelPricing["packages"]>[number]

export type TBookPublicHotel = {
  id: string
  name: string
  description: string
  address: string
  distanceFromVenueKm: number | null
  gallery: string[]
  currency?: string
  /** Max accommodation guests for this hotel (null = unlimited). */
  bookingCapacity?: number | null
  /** Remaining hotel-level guest capacity (null = unlimited). */
  remainingCapacity?: number | null
  /** Shared room/package-unit pool across packages (null = unlimited). */
  roomInventory?: number | null
  /** Remaining shared room units (null = unlimited). */
  remainingRoomInventory?: number | null
  registrationFieldSchema?: TBookPublicAttendeeFieldDef[]
  pricing: TBookHotelPricing
}

export type TBookPriceQuote = {
  guests: number
  accommodationGuests?: number
  nights: number
  ticketSubtotalHuf: number
  accommodationBaseHuf: number
  accommodationOptionsHuf: number
  accommodationSubtotalHuf: number
  totalHuf: number
  lines: { key: string; label: string; amountHuf: number }[]
}

export type TBookSelections = Record<
  string,
  string | number | boolean | string[] | Record<string, number>
>

export type TBookBookingAttendeePayload = {
  fields: Record<string, string | number>
  members?: Array<{ fields: Record<string, string | number> }>
}

export type TBookPublicDirectoryListing = {
  id: string
  title: string
  url: string
  image: string
  activeEventCount: number
  nextEventStart: string | null
}

export function fetchPublicDirectory(apiBase?: string) {
  const base = apiBase?.replace(/\/$/, "") ?? TBOOK_SAME_ORIGIN_API_BASE
  return fetch(`${base}/directory`).then(async (res) => {
    const data = (await res.json()) as {
      ok?: boolean
      listings?: TBookPublicDirectoryListing[]
      error?: string
    }
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
    return data.listings ?? []
  })
}

async function tbookFetch<T>(
  apiKey: string,
  path: string,
  init?: RequestInit,
  apiBase?: string
): Promise<T> {
  const key = normalizeTBookApiKey(apiKey)
  if (!key) {
    throw new Error("The tBook API key is empty or invalid.")
  }

  const base = apiBase?.replace(/\/$/, "") ?? TBOOK_SAME_ORIGIN_API_BASE
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      [TBOOK_API_KEY_HEADER]: key,
      ...(init?.headers ?? {}),
    },
  })
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  return data
}

export function listEvents(apiKey: string, apiBase?: string) {
  return tbookFetch<{ ok: true; events: TBookPublicEvent[]; currency?: string }>(
    apiKey,
    "/events",
    undefined,
    apiBase
  )
}

export function getEventDetail(apiKey: string, eventId: string, apiBase?: string) {
  return tbookFetch<{
    ok: true
    event: TBookPublicEvent
    groupBookingOptions: TBookPublicOptionDef[]
    hotels: TBookPublicHotel[]
  }>(apiKey, `/events/${eventId}`, undefined, apiBase)
}

export function quoteBooking(
  apiKey: string,
  body: {
    eventId: string
    guests: number
    /** Hotel headcount (can be less than ticket×players). Omit = all entries. */
    accommodationGuests?: number | null
    teamMemberCount?: number | null
    hotelId?: string | null
    nights?: number | null
    selections?: TBookSelections | null
  },
  apiBase?: string
) {
  return tbookFetch<{ ok: true; quote: TBookPriceQuote }>(
    apiKey,
    "/quote",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    apiBase
  )
}

export type TBookMultiQuoteEntry = {
  eventId: string
  guests: number
  accommodationGuests?: number | null
  teamMemberCount?: number | null
  hotelId?: string | null
  nights?: number | null
  selections?: TBookSelections | null
}

export function quoteMultiBooking(
  apiKey: string,
  body: {
    lodgingMode: "combined" | "separate"
    entries: TBookMultiQuoteEntry[]
    hotelId?: string | null
    nights?: number | null
    selections?: TBookSelections | null
    accommodationGuests?: number | null
  },
  apiBase?: string
) {
  return tbookFetch<{
    ok: true
    lodgingMode: "combined" | "separate"
    entries: Array<{ eventId: string; eventName: string; quote: TBookPriceQuote }>
    quote: TBookPriceQuote
  }>(
    apiKey,
    "/quote",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    apiBase
  )
}

export function createBooking(
  apiKey: string,
  body: {
    eventId: string
    guests: number
    accommodationGuests?: number | null
    teamMemberCount?: number | null
    customer: { name: string; email: string; phone: string; note?: string }
    attendees?: TBookBookingAttendeePayload[]
    billing: {
      billingType: "personal" | "company" | "sport"
      name: string
      zip: string
      city: string
      street: string
      countryCode: string
      taxNumber?: string
    }
    returnBaseUrl?: string
    hotelId?: string | null
    nights?: number | null
    selections?: TBookSelections | null
  },
  apiBase?: string
) {
  return tbookFetch<{
    ok: true
    bookingId: string
    totalHuf: number
    quote: TBookPriceQuote
    checkoutUrl: string
    stripeSessionId: string
    expiresAt: string
  }>(
    apiKey,
    "/bookings",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    apiBase
  )
}

export function createMultiBooking(
  apiKey: string,
  body: {
    lodgingMode: "combined" | "separate"
    entries: Array<
      TBookMultiQuoteEntry & {
        attendees?: TBookBookingAttendeePayload[]
      }
    >
    customer: { name: string; email: string; phone: string; note?: string }
    billing: {
      billingType: "personal" | "company" | "sport"
      name: string
      zip: string
      city: string
      street: string
      countryCode: string
      taxNumber?: string
    }
    returnBaseUrl?: string
    hotelId?: string | null
    nights?: number | null
    selections?: TBookSelections | null
    accommodationGuests?: number | null
  },
  apiBase?: string
) {
  return tbookFetch<{
    ok: true
    bookingId: string
    bookingIds: string[]
    checkoutBundleId: string
    totalHuf: number
    checkoutUrl: string
    stripeSessionId: string
    expiresAt: string
  }>(
    apiKey,
    "/bookings",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    apiBase
  )
}

export function formatHuf(amount: number, currency: string = DEFAULT_TBOOK_CURRENCY): string {
  return formatTBookMoney(amount, currency)
}

import { normalizeTBookApiKey, TBOOK_API_KEY_HEADER } from "../lib/api-key"
import { DEFAULT_TBOOK_CURRENCY, formatTBookMoney } from "../lib/currency"
import { TBOOK_SAME_ORIGIN_API_BASE } from "../lib/tbook-api-base"
import type { TBookHotelPricing, TBookOptionDef } from "../lib/pricing-types"

export { resolveTBookServerApiBase, TBOOK_SAME_ORIGIN_API_BASE } from "../lib/tbook-api-base"

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
  nights: number
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking" | "per_team"
  registrationUnit?: "person" | "team"
  teamMemberLimit?: number | null
  teamMemberFieldSchema?: TBookPublicAttendeeFieldDef[]
  currency?: string
  heroImage: string
  attendeeFieldSchema: TBookPublicAttendeeFieldDef[]
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
  registrationFieldSchema?: TBookPublicAttendeeFieldDef[]
  pricing: TBookHotelPricing
}

export type TBookPriceQuote = {
  guests: number
  nights: number
  ticketSubtotalHuf: number
  accommodationBaseHuf: number
  accommodationOptionsHuf: number
  accommodationSubtotalHuf: number
  totalHuf: number
  lines: { key: string; label: string; amountHuf: number }[]
}

export type TBookSelections = Record<string, string | number | boolean | string[]>

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
    throw new Error("A tBook API kulcs üres vagy érvénytelen.")
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

export function createBooking(
  apiKey: string,
  body: {
    eventId: string
    guests: number
    customer: { name: string; email: string; phone: string; note?: string }
    attendees?: TBookBookingAttendeePayload[]
    billing?: {
      name: string
      zip: string
      city: string
      street: string
      countryCode: string
      taxNumber?: string
    } | null
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

export function formatHuf(amount: number, currency: string = DEFAULT_TBOOK_CURRENCY): string {
  return formatTBookMoney(amount, currency)
}

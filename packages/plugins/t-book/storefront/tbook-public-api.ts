/** Override for split deploys: tester UI on one host, API + secrets on admin host. */
const API_BASE =
  process.env.NEXT_PUBLIC_TBOOK_API_BASE?.replace(/\/$/, "") || "/api/plugins/t-book"

export type TBookPublicEvent = {
  id: string
  name: string
  description: string
  location: { address?: string; lat?: number | null; lng?: number | null }
  startDate: string
  endDate: string
  nights: number
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking"
  heroImage: string
}

export type TBookPublicOptionDef = {
  key: string
  label: string
  type: "select" | "multiselect" | "number" | "checkbox"
  required?: boolean
  defaultValue?: string | number | boolean | string[] | null
  choices?: { value: string; label: string; priceHuf: number; priceMode: string }[]
  unitPriceHuf?: number
  priceMode?: string
  min?: number
  max?: number
  dependsOn?: { key: string; values: string[] } | null
}

export type TBookPublicRoomType = {
  key: string
  label: string
  baseRateHuf: number
}

export type TBookPublicHotel = {
  id: string
  name: string
  description: string
  address: string
  distanceFromVenueKm: number | null
  gallery: string[]
  pricing: {
    priceBasis: "net" | "gross"
    vatPercent: number
    roomTypes: TBookPublicRoomType[]
    addonGroups: { key: string; label: string; options: TBookPublicOptionDef[] }[]
  }
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

async function tbookFetch<T>(
  apiKey: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-TBook-Api-Key": apiKey,
      ...(init?.headers ?? {}),
    },
  })
  const data = (await res.json()) as T & { error?: string }
  if (!res.ok) {
    throw new Error(data.error ?? `HTTP ${res.status}`)
  }
  return data
}

export function listEvents(apiKey: string) {
  return tbookFetch<{ ok: true; events: TBookPublicEvent[] }>(apiKey, "/events")
}

export function getEventDetail(apiKey: string, eventId: string) {
  return tbookFetch<{
    ok: true
    event: TBookPublicEvent
    groupBookingOptions: TBookPublicOptionDef[]
    hotels: TBookPublicHotel[]
  }>(apiKey, `/events/${eventId}`)
}

export function quoteBooking(
  apiKey: string,
  body: {
    eventId: string
    guests: number
    hotelId?: string | null
    nights?: number | null
    selections?: TBookSelections | null
  }
) {
  return tbookFetch<{ ok: true; quote: TBookPriceQuote }>(apiKey, "/quote", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function createBooking(
  apiKey: string,
  body: {
    eventId: string
    guests: number
    customer: { name: string; email: string; phone: string; note?: string }
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
  }
) {
  return tbookFetch<{
    ok: true
    bookingId: string
    totalHuf: number
    quote: TBookPriceQuote
    checkoutUrl: string
    stripeSessionId: string
    expiresAt: string
  }>(apiKey, "/bookings", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function formatHuf(amount: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(amount)
}

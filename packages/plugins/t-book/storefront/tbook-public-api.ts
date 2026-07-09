/** Default API root; override per-call for split deploys (tester UI → admin API). */
export function resolveTBookApiBase(override?: string): string {
  const trimmed = override?.replace(/\/$/, "")
  if (trimmed) return trimmed
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_TBOOK_API_BASE?.trim()) {
    return process.env.NEXT_PUBLIC_TBOOK_API_BASE.replace(/\/$/, "")
  }
  return "/api/plugins/t-book"
}

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
  nights: number
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking"
  heroImage: string
  attendeeFieldSchema: TBookPublicAttendeeFieldDef[]
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

export type TBookBookingAttendeePayload = {
  fields: Record<string, string | number>
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
  return fetch(`${resolveTBookApiBase(apiBase)}/directory`).then(async (res) => {
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
  const res = await fetch(`${resolveTBookApiBase(apiBase)}${path}`, {
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

export function listEvents(apiKey: string, apiBase?: string) {
  return tbookFetch<{ ok: true; events: TBookPublicEvent[] }>(apiKey, "/events", undefined, apiBase)
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

export function formatHuf(amount: number): string {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(amount)
}

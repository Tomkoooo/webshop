/**
 * Builds booking quote/submit matrices from live event + hotel inventory.
 * Rows come from discovered data — including multi-event and lodging headcount variants.
 */
import {
  PACKAGE_DEAL_SELECTION_KEY,
  ROOM_TYPE_SELECTION_KEY,
  resolveAccommodationMode,
} from "@wse/plugin-t-book/lib/hotel-pricing"
import type {
  TBookPublicEvent,
  TBookPublicHotel,
  TBookSelections,
  TBookMultiQuoteEntry,
} from "@wse/plugin-t-book/storefront/tbook-public-api"

export type LiveQuoteCase = {
  id: string
  eventId: string
  eventName: string
  currency: string
  guests: number
  /** null = all entries need rooms; 0 = entry only; 1..n-1 = partial group hotel */
  accommodationGuests: number | null
  hotelId: string | null
  hotelName: string | null
  nights: number | null
  selections: TBookSelections
  kind: "entry_only" | "room" | "package"
  lodgingScope: "none" | "full_group" | "partial_group"
  /** Stripe checkout is only attempted when total is expected to clear gateway mins. */
  submitCandidate: boolean
}

export type LiveMultiQuoteCase = {
  id: string
  lodgingMode: "combined" | "separate"
  currency: string
  entries: TBookMultiQuoteEntry[]
  /** Top-level lodging fields used when lodgingMode is combined */
  hotelId?: string | null
  hotelName?: string | null
  nights?: number | null
  selections?: TBookSelections | null
  accommodationGuests?: number | null
  kind: "multi_entry_only" | "multi_combined_hotel" | "multi_separate_hotels"
  submitCandidate: boolean
}

export type EventHotelBundle = {
  event: TBookPublicEvent
  hotels: TBookPublicHotel[]
}

type HotelStayOption = {
  hotel: TBookPublicHotel
  kind: "room" | "package"
  nights: number
  selections: TBookSelections
  optionKey: string
  minGuests: number
}

function currencyOf(event: TBookPublicEvent, hotel?: TBookPublicHotel | null): string {
  return (hotel?.currency || event.currency || "HUF").toUpperCase()
}

/** Stripe minimums in major units (approx). Skip submit below these. */
export function meetsStripeMinimum(total: number, currency: string): boolean {
  const c = currency.toUpperCase()
  if (c === "HUF") return total >= 175
  if (c === "EUR" || c === "USD" || c === "GBP" || c === "CHF") return total >= 0.5
  return total > 0
}

function hotelStayOptions(event: TBookPublicEvent, hotel: TBookPublicHotel): HotelStayOption[] {
  const mode = resolveAccommodationMode(hotel.pricing)
  const defaultNights = Math.max(1, event.nights ?? 1)
  const options: HotelStayOption[] = []

  if (mode === "packages" || mode === "both") {
    for (const pkg of hotel.pricing.packages ?? []) {
      options.push({
        hotel,
        kind: "package",
        nights: pkg.nights,
        selections: { [PACKAGE_DEAL_SELECTION_KEY]: pkg.key },
        optionKey: `pkg:${pkg.key}`,
        minGuests: Math.max(1, pkg.maxGuests ?? 1),
      })
    }
  }

  if (mode === "room_nights" || mode === "both") {
    for (const room of hotel.pricing.roomTypes ?? []) {
      options.push({
        hotel,
        kind: "room",
        nights: defaultNights,
        selections: { [ROOM_TYPE_SELECTION_KEY]: room.key },
        optionKey: `room:${room.key}`,
        minGuests: 1,
      })
    }
  }

  return options
}

/**
 * Expand every discovered event into:
 * - entry only
 * - each hotel room/package for the full group
 * - each hotel room/package for a partial group (some entries without a room)
 */
export function buildLiveQuoteMatrix(bundles: EventHotelBundle[]): LiveQuoteCase[] {
  const cases: LiveQuoteCase[] = []

  for (const { event, hotels } of bundles) {
    const fee = Number(event.ticketFeeHuf) || 0
    const entryCurrency = currencyOf(event)

    cases.push({
      id: `${event.id}:entry-only`,
      eventId: event.id,
      eventName: event.name,
      currency: entryCurrency,
      guests: 1,
      accommodationGuests: 0,
      hotelId: null,
      hotelName: null,
      nights: null,
      selections: {},
      kind: "entry_only",
      lodgingScope: "none",
      submitCandidate: fee > 0,
    })

    for (const hotel of hotels) {
      for (const option of hotelStayOptions(event, hotel)) {
        const currency = currencyOf(event, hotel)
        const fullGuests = Math.max(2, option.minGuests)

        cases.push({
          id: `${event.id}:hotel:${hotel.id}:${option.optionKey}:full`,
          eventId: event.id,
          eventName: event.name,
          currency,
          guests: fullGuests,
          accommodationGuests: fullGuests,
          hotelId: hotel.id,
          hotelName: hotel.name,
          nights: option.nights,
          selections: option.selections,
          kind: option.kind,
          lodgingScope: "full_group",
          submitCandidate: true,
        })

        // Partial group: more entries than hotel beds (API: accommodationGuests < guests).
        if (fullGuests >= 2) {
          cases.push({
            id: `${event.id}:hotel:${hotel.id}:${option.optionKey}:partial`,
            eventId: event.id,
            eventName: event.name,
            currency,
            guests: fullGuests,
            accommodationGuests: 1,
            hotelId: hotel.id,
            hotelName: hotel.name,
            nights: option.nights,
            selections: option.selections,
            kind: option.kind,
            lodgingScope: "partial_group",
            submitCandidate: true,
          })
        }
      }
    }
  }

  return cases
}

/**
 * Multi-event matrix from discovered inventory:
 * - entry-only across 2+ events
 * - combined lodging: one shared hotel on the primary event
 * - separate lodging: different hotels (or hotel + entry-only) per event
 *
 * Note: the API does not support different hotels per person inside one event —
 * only one hotelId per entry, with optional partial accommodationGuests.
 */
export function buildLiveMultiQuoteMatrix(bundles: EventHotelBundle[]): LiveMultiQuoteCase[] {
  const cases: LiveMultiQuoteCase[] = []
  if (bundles.length < 2) return cases

  const paid = bundles.filter((b) => (Number(b.event.ticketFeeHuf) || 0) > 0)
  const withHotels = bundles.filter((b) => b.hotels.length > 0)
  const pairSources = paid.length >= 2 ? paid : bundles
  const a = pairSources[0]!
  const b = pairSources[1]!
  const currency = currencyOf(a.event)

  cases.push({
    id: `multi:entry-only:${a.event.id}+${b.event.id}`,
    lodgingMode: "combined",
    currency,
    entries: [
      { eventId: a.event.id, guests: 1, accommodationGuests: 0, hotelId: null },
      { eventId: b.event.id, guests: 1, accommodationGuests: 0, hotelId: null },
    ],
    hotelId: null,
    nights: null,
    selections: null,
    accommodationGuests: 0,
    kind: "multi_entry_only",
    submitCandidate: (Number(a.event.ticketFeeHuf) || 0) + (Number(b.event.ticketFeeHuf) || 0) > 0,
  })

  // Combined: shared hotel billed on primary event; secondary is entries only for lodging.
  const primary = withHotels[0] ?? a
  for (const hotel of primary.hotels) {
    for (const option of hotelStayOptions(primary.event, hotel).slice(0, 2)) {
      const secondary =
        pairSources.find((bundle) => bundle.event.id !== primary.event.id) ?? b
      cases.push({
        id: `multi:combined:${primary.event.id}+${secondary.event.id}:hotel:${hotel.id}:${option.optionKey}`,
        lodgingMode: "combined",
        currency: currencyOf(primary.event, hotel),
        entries: [
          {
            eventId: primary.event.id,
            guests: Math.max(2, option.minGuests),
            accommodationGuests: Math.max(2, option.minGuests),
          },
          {
            eventId: secondary.event.id,
            guests: 1,
            accommodationGuests: 0,
          },
        ],
        hotelId: hotel.id,
        hotelName: hotel.name,
        nights: option.nights,
        selections: option.selections,
        accommodationGuests: Math.max(2, option.minGuests),
        kind: "multi_combined_hotel",
        submitCandidate: true,
      })
    }
  }

  // Separate: each event can reserve its own hotel (different hotels when available).
  if (withHotels.length >= 1) {
    const first = withHotels[0]!
    const second = withHotels.find((bundle) => bundle.event.id !== first.event.id) ?? pairSources.find((bundle) => bundle.event.id !== first.event.id) ?? b
    const firstOption = hotelStayOptions(first.event, first.hotels[0]!)[0]
    if (firstOption) {
      const secondHotel =
        second.hotels.find((h) => h.id !== firstOption.hotel.id) ?? second.hotels[0] ?? null
      const secondOption = secondHotel
        ? hotelStayOptions(second.event, secondHotel)[0]
        : null

      cases.push({
        id: `multi:separate:${first.event.id}+${second.event.id}:hotel+entry`,
        lodgingMode: "separate",
        currency: currencyOf(first.event, firstOption.hotel),
        entries: [
          {
            eventId: first.event.id,
            guests: Math.max(2, firstOption.minGuests),
            accommodationGuests: Math.max(2, firstOption.minGuests),
            hotelId: firstOption.hotel.id,
            nights: firstOption.nights,
            selections: firstOption.selections,
          },
          {
            eventId: second.event.id,
            guests: 1,
            accommodationGuests: 0,
            hotelId: null,
          },
        ],
        kind: "multi_separate_hotels",
        submitCandidate: true,
      })

      if (secondOption) {
        cases.push({
          id: `multi:separate:${first.event.id}+${second.event.id}:hotel+hotel`,
          lodgingMode: "separate",
          currency: currencyOf(first.event, firstOption.hotel),
          entries: [
            {
              eventId: first.event.id,
              guests: Math.max(2, firstOption.minGuests),
              accommodationGuests: Math.max(2, firstOption.minGuests),
              hotelId: firstOption.hotel.id,
              nights: firstOption.nights,
              selections: firstOption.selections,
            },
            {
              eventId: second.event.id,
              guests: Math.max(2, secondOption.minGuests),
              accommodationGuests: Math.max(2, secondOption.minGuests),
              hotelId: secondOption.hotel.id,
              nights: secondOption.nights,
              selections: secondOption.selections,
            },
          ],
          kind: "multi_separate_hotels",
          submitCandidate: true,
        })

        // Separate + partial lodging on one event
        cases.push({
          id: `multi:separate:${first.event.id}+${second.event.id}:partial+hotel`,
          lodgingMode: "separate",
          currency: currencyOf(first.event, firstOption.hotel),
          entries: [
            {
              eventId: first.event.id,
              guests: 2,
              accommodationGuests: 1,
              hotelId: firstOption.hotel.id,
              nights: firstOption.nights,
              selections: firstOption.selections,
            },
            {
              eventId: second.event.id,
              guests: Math.max(2, secondOption.minGuests),
              accommodationGuests: Math.max(2, secondOption.minGuests),
              hotelId: secondOption.hotel.id,
              nights: secondOption.nights,
              selections: secondOption.selections,
            },
          ],
          kind: "multi_separate_hotels",
          submitCandidate: true,
        })
      }
    }
  }

  return cases
}

/** Pick a small diverse submit sample from a quoted matrix (entry + hotel if available). */
export function pickSubmitCases<T extends LiveQuoteCase & { total: number }>(
  quoted: T[],
  limit = 3
): T[] {
  const ok = quoted.filter((row) => row.submitCandidate && meetsStripeMinimum(row.total, row.currency))
  const entry = ok.find((row) => row.kind === "entry_only")
  const full = ok.find((row) => row.lodgingScope === "full_group")
  const partial = ok.find((row) => row.lodgingScope === "partial_group")
  const rest = ok.filter((row) => row !== entry && row !== full && row !== partial)
  const picked = [entry, full, partial, ...rest].filter(Boolean) as T[]
  return picked.slice(0, limit)
}

export function pickMultiSubmitCases<T extends LiveMultiQuoteCase & { total: number }>(
  quoted: T[],
  limit = 3
): T[] {
  const ok = quoted.filter((row) => row.submitCandidate && meetsStripeMinimum(row.total, row.currency))
  const entryOnly = ok.find((row) => row.kind === "multi_entry_only")
  const combined = ok.find((row) => row.kind === "multi_combined_hotel")
  const separate = ok.find((row) => row.kind === "multi_separate_hotels")
  const rest = ok.filter((row) => row !== entryOnly && row !== combined && row !== separate)
  return [entryOnly, combined, separate, ...rest].filter(Boolean).slice(0, limit) as T[]
}

type FieldDef = {
  key: string
  type?: string
  required?: boolean
  choices?: Array<{ value: string }>
  min?: number
  max?: number
}

/** Retry helper for live HTTP matrix runs (rate limits / transient 5xx). */
export async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  opts?: { attempts?: number; baseDelayMs?: number }
): Promise<T> {
  const attempts = opts?.attempts ?? 6
  const baseDelayMs = opts?.baseDelayMs ?? 1500
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const message = error instanceof Error ? error.message : String(error)
      const retryable = /too many requests|try again|429|ECONNRESET|fetch failed/i.test(message)
      if (!retryable || i === attempts - 1) throw error
      const wait = baseDelayMs * (i + 1)
      await new Promise((resolve) => setTimeout(resolve, wait))
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${label} failed`)
}

/** Fill required attendee fields discovered from the event/hotel registration schema. */
export function buildAttendeesForSchema(
  guests: number,
  schema: FieldDef[] | null | undefined
): Array<{ fields: Record<string, string | number> }> {
  const fields = schema ?? []
  return Array.from({ length: guests }, () => {
    const values: Record<string, string | number> = {}
    for (const field of fields) {
      if (!field.required && field.type !== "select") continue
      switch (field.type) {
        case "email":
          values[field.key] = "matrix-tester@example.com"
          break
        case "phone":
          values[field.key] = "+36123456789"
          break
        case "number":
          values[field.key] = field.min ?? 1990
          break
        case "date":
          values[field.key] = "1990-01-01"
          break
        case "select":
          if (field.choices?.[0]?.value) values[field.key] = field.choices[0].value
          break
        default:
          values[field.key] = "Matrix Tester"
      }
    }
    return { fields: values }
  })
}

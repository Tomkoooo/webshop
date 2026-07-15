import { normalizeTBookApiKey, TBOOK_API_KEY_HEADER } from "./api-key"
import { DEFAULT_TBOOK_CURRENCY, normalizeTBookCurrency } from "./currency"
import { resolveTBookServerApiBase } from "./tbook-api-base"
import type {
  TBookPublicEvent,
  TBookPublicHotel,
  TBookPublicOptionDef,
} from "../storefront/tbook-public-api"

export type TBookPublicEventsResult = {
  events: TBookPublicEvent[]
  currency: string
  error: string | null
}

export type TBookPublicEventDetailResult = {
  event: TBookPublicEvent | null
  hotels: TBookPublicHotel[]
  groupBookingOptions: TBookPublicOptionDef[]
  error: string | null
}

async function tbookServerFetch(
  apiKey: string,
  path: string,
  apiBaseOverride?: string
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const key = normalizeTBookApiKey(apiKey)
  if (!key) {
    return {
      ok: false,
      status: 401,
      data: { error: "A tBook API kulcs nincs beállítva. Add meg a CMS-ben a főoldal integrációs beállításainál, majd tedd közzé." },
    }
  }

  const base = resolveTBookServerApiBase(apiBaseOverride)
  const res = await fetch(`${base}${path}`, {
    headers: {
      Accept: "application/json",
      [TBOOK_API_KEY_HEADER]: key,
    },
    cache: "no-store",
  })
  const data = (await res.json()) as Record<string, unknown>
  return { ok: res.ok, status: res.status, data }
}

/** Server-side event list — same path as CMS connection test and booking SSR. */
export async function fetchPublicEventsForStorefront(
  apiKey: string,
  apiBaseOverride?: string
): Promise<TBookPublicEventsResult> {
  try {
    const { ok, data } = await tbookServerFetch(apiKey, "/events", apiBaseOverride)
    if (!ok) {
      return {
        events: [],
        currency: DEFAULT_TBOOK_CURRENCY,
        error: String(data.error ?? "Nem sikerült betölteni az eseményeket."),
      }
    }
    return {
      events: (data.events as TBookPublicEvent[] | undefined) ?? [],
      currency: normalizeTBookCurrency(data.currency as string | undefined),
      error: null,
    }
  } catch (err) {
    return {
      events: [],
      currency: DEFAULT_TBOOK_CURRENCY,
      error: err instanceof Error ? err.message : "Nem sikerült betölteni az eseményeket.",
    }
  }
}

/** Server-side event detail for the booking wizard — avoids a separate client fetch path. */
export async function fetchPublicEventDetailForStorefront(
  apiKey: string,
  eventId: string,
  apiBaseOverride?: string
): Promise<TBookPublicEventDetailResult> {
  try {
    const { ok, data } = await tbookServerFetch(apiKey, `/events/${eventId}`, apiBaseOverride)
    if (!ok) {
      return {
        event: null,
        hotels: [],
        groupBookingOptions: [],
        error: String(data.error ?? "Esemény nem található"),
      }
    }
    return {
      event: (data.event as TBookPublicEvent | undefined) ?? null,
      hotels: (data.hotels as TBookPublicHotel[] | undefined) ?? [],
      groupBookingOptions: (data.groupBookingOptions as TBookPublicOptionDef[] | undefined) ?? [],
      error: null,
    }
  } catch (err) {
    return {
      event: null,
      hotels: [],
      groupBookingOptions: [],
      error: err instanceof Error ? err.message : "Nem sikerült betölteni az eseményt.",
    }
  }
}

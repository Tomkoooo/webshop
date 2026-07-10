import { normalizeTBookApiKey, TBOOK_API_KEY_HEADER } from "./api-key"
import { resolveTBookApiBase } from "../storefront/tbook-public-api"
import type { TBookPublicEvent } from "../storefront/tbook-public-api"

export type TBookPublicEventsResult = {
  events: TBookPublicEvent[]
  error: string | null
}

/** Server-side event list fetch (avoids exposing API keys in browser fetch headers). */
export async function fetchPublicEventsForStorefront(
  apiKey: string,
  apiBaseOverride?: string
): Promise<TBookPublicEventsResult> {
  const key = normalizeTBookApiKey(apiKey)
  if (!key) {
    return {
      events: [],
      error: "A tBook API kulcs nincs beállítva. Add meg a CMS-ben a főoldal integrációs beállításainál, majd tedd közzé.",
    }
  }

  const base = resolveTBookApiBase(apiBaseOverride)
  try {
    const res = await fetch(`${base}/events`, {
      headers: {
        Accept: "application/json",
        [TBOOK_API_KEY_HEADER]: key,
      },
      cache: "no-store",
    })
    const data = (await res.json()) as {
      ok?: boolean
      events?: TBookPublicEvent[]
      error?: string
    }
    if (!res.ok) {
      return { events: [], error: data.error ?? `HTTP ${res.status}` }
    }
    return { events: data.events ?? [], error: null }
  } catch (err) {
    return {
      events: [],
      error: err instanceof Error ? err.message : "Nem sikerült betölteni az eseményeket.",
    }
  }
}

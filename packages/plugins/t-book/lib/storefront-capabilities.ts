import {
  fetchPublicEventDetailForStorefront,
  fetchPublicEventsForStorefront,
} from "./fetch-public-storefront"
import { hotelRequiresPackageSelection, hotelShowsRoomSelection } from "./hotel-pricing"
import type { TBookPublicEvent } from "../storefront/tbook-public-api"

/** Mirrors `info.version` in `lib/openapi.ts`. */
export const TBOOK_PUBLIC_API_VERSION = "1.1.0"

export type TBookStorefrontCapabilities = {
  apiVersion: string
  eventCount: number
  hotelCount: number
  packageHotels: number
  roomHotels: number
  packageDeals: number
  eventsWithRegistrationFields: number
  teamEvents: number
}

function countRegistrationEvents(events: TBookPublicEvent[]): number {
  return events.filter((e) => (e.attendeeFieldSchema?.length ?? 0) > 0).length
}

function countTeamEvents(events: TBookPublicEvent[]): number {
  return events.filter((e) => e.registrationUnit === "team").length
}

/**
 * Probes the public tBook API (local or upstream) and summarizes storefront-relevant features.
 * Used by CMS connection test and operator diagnostics.
 */
export async function probeTBookStorefrontCapabilities(
  apiKey: string,
  apiBaseOverride?: string
): Promise<{ capabilities: TBookStorefrontCapabilities | null; error: string | null }> {
  const { events, error: listError } = await fetchPublicEventsForStorefront(apiKey, apiBaseOverride)
  if (listError) {
    return { capabilities: null, error: listError }
  }

  const base: TBookStorefrontCapabilities = {
    apiVersion: TBOOK_PUBLIC_API_VERSION,
    eventCount: events.length,
    hotelCount: 0,
    packageHotels: 0,
    roomHotels: 0,
    packageDeals: 0,
    eventsWithRegistrationFields: countRegistrationEvents(events),
    teamEvents: countTeamEvents(events),
  }

  if (events.length === 0) {
    return { capabilities: base, error: null }
  }

  const sample = await fetchPublicEventDetailForStorefront(
    apiKey,
    events[0]!.id,
    apiBaseOverride
  )
  if (sample.error || !sample.event) {
    return { capabilities: base, error: null }
  }

  for (const hotel of sample.hotels) {
    const packages = hotel.pricing.packages ?? []
    if (hotelRequiresPackageSelection(hotel.pricing) || packages.length > 0) {
      base.packageHotels += 1
      base.packageDeals += packages.length
    }
    if (hotelShowsRoomSelection(hotel.pricing)) {
      base.roomHotels += 1
    }
  }
  base.hotelCount = sample.hotels.length

  return { capabilities: base, error: null }
}

export function formatTBookCapabilitiesSummary(cap: TBookStorefrontCapabilities): string {
  const parts = [`${cap.eventCount} esemény`]
  if (cap.hotelCount > 0) {
    const hotelBits: string[] = []
    if (cap.packageHotels > 0) {
      hotelBits.push(
        `${cap.packageHotels} csomagos szállás (${cap.packageDeals} ajánlat)`
      )
    }
    if (cap.roomHotels > 0) hotelBits.push(`${cap.roomHotels} szobás szállás`)
    parts.push(`${cap.hotelCount} szállás: ${hotelBits.join(", ") || "—"}`)
  }
  if (cap.eventsWithRegistrationFields > 0) {
    parts.push(`${cap.eventsWithRegistrationFields} regisztrációs mezővel`)
  }
  if (cap.teamEvents > 0) parts.push(`${cap.teamEvents} csapat esemény`)
  parts.push(`API v${cap.apiVersion}`)
  return parts.join(" · ")
}

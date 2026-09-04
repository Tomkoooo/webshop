import "server-only"

/**
 * Server-side reader for tDarts' public "embed" API — no secret involved
 * (the embed client id is browser-safe, origin-allowlisted only; see
 * docs/api/partner-embed-and-enroll.md in tdarts_torunament). Used to
 * pre-render tournament cards on /versenyek so the list has real data on
 * first paint instead of a client-side fetch waterfall. The live /verseny
 * page still fetches from the browser directly (for SSE); this is a
 * separate, read-only server path for listing pages.
 */

export type TDartsEmbedConfigRef = { apiBaseUrl: string; embedClientId: string }

export type TDartsClubSummary = {
  id: string
  name: string
  location: string | null
  logoMediaId?: string | null
}

export type TDartsVisitorInfo = {
  coverImage?: string | null
  parkingInfo?: string | null
  foodDrinksInfo?: string | null
  boardType?: "steel" | "soft" | null
}

export type TDartsTournamentOverview = {
  name: string
  status: string
  format: string
  participationMode: string
  openness: "amateur" | "open"
  startDate: string
  registrationDeadline: string | null
  playerCount: number
  maxPlayers: number
  boardCount: number
  location: string | null
  county: string | null
  entryFee: number
  entryFeeCurrency: string
  description: string | null
  club: TDartsClubSummary | null
  visitorInfo: TDartsVisitorInfo | null
}

async function embedGet<T>(
  config: TDartsEmbedConfigRef,
  path: string
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${config.apiBaseUrl}${path}`, {
      headers: { "X-Client-Id": config.embedClientId },
      cache: "no-store",
    })
    if (!res.ok) return { ok: false, error: `tDarts embed ${res.status}` }
    return { ok: true, data: (await res.json()) as T }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "tDarts embed fetch failed" }
  }
}

export async function fetchTDartsOverview(
  config: TDartsEmbedConfigRef,
  tournamentCode: string
): Promise<TDartsTournamentOverview | null> {
  const result = await embedGet<TDartsTournamentOverview>(
    config,
    `/embed/tournaments/${tournamentCode}`
  )
  return result.ok ? result.data : null
}

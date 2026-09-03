"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@wse/core/lib/utils"

/**
 * Read-only live tournament view, sourced directly from tDarts' `@tdarts/api`
 * embed surface (browser → api.tdarts.hu, no tbook proxy — the embed client
 * id is not a secret, only origin-allowlisted). No writes happen here;
 * moderators manage everything on tdarts.hu. Contract:
 * docs/api/partner-embed-and-enroll.md in tdarts_torunament.
 */

export type TDartsTournamentEmbedProps = {
  tournamentCode: string
  apiBaseUrl: string
  embedClientId: string
  copy?: Partial<TDartsEmbedCopy>
}

type TDartsEmbedCopy = {
  tabOverview: string
  tabLive: string
  tabBracket: string
  tabPlayers: string
  loading: string
  loadError: string
  liveEmpty: string
  upcomingHeading: string
  recentHeading: string
  bracketEmpty: string
  playersHeading: string
  waitingHeading: string
  players: string
  spotsLabel: string
  statusLabels: Record<string, string>
}

const DEFAULT_COPY: TDartsEmbedCopy = {
  tabOverview: "Áttekintés",
  tabLive: "Élő",
  tabBracket: "Egyenes kiesés",
  tabPlayers: "Nevezettek",
  loading: "Betöltés…",
  loadError: "A torna adatai jelenleg nem érhetők el.",
  liveEmpty: "Jelenleg nincs élő mérkőzés.",
  upcomingHeading: "Következő mérkőzések",
  recentHeading: "Legutóbbi eredmények",
  bracketEmpty: "Az egyenes kieséses tábla még nem generált.",
  playersHeading: "Nevezettek",
  waitingHeading: "Várólista",
  players: "fő",
  spotsLabel: "hely",
  statusLabels: { pending: "Váró", ongoing: "Folyamatban", finished: "Vége" },
}

type Overview = {
  name: string
  status: string
  startDate: string
  location: string | null
  county: string | null
  playerCount: number
  maxPlayers: number
  description: string | null
}

type MatchItem = {
  matchId: string
  boardNumber: number
  status: "pending" | "ongoing" | "finished"
  player1Name: string
  player2Name: string
  player1LegsWon: number
  player2LegsWon: number
}

type LiveMatches = { live: MatchItem[]; upcoming: MatchItem[]; recent: MatchItem[] }

type BracketMatch = {
  player1Name?: string | null
  player2Name?: string | null
  status?: "pending" | "ongoing" | "finished"
  player1LegsWon?: number
  player2LegsWon?: number
}

type Bracket = { rounds: { round: number; matches: BracketMatch[] }[] }

type PlayerRow = { id: string; displayName: string; avatarUrl: string | null }
type Players = { players: PlayerRow[]; waitingListCount: number }

type Tab = "overview" | "live" | "bracket" | "players"

function useEmbedFetch(apiBaseUrl: string, embedClientId: string) {
  return useCallback(
    async <T,>(path: string): Promise<T> => {
      const res = await fetch(`${apiBaseUrl}${path}`, {
        headers: { "X-Client-Id": embedClientId },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`tDarts embed ${res.status}`)
      return (await res.json()) as T
    },
    [apiBaseUrl, embedClientId]
  )
}

export function TDartsTournamentEmbed({
  tournamentCode,
  apiBaseUrl,
  embedClientId,
  copy,
}: TDartsTournamentEmbedProps) {
  const c = { ...DEFAULT_COPY, ...copy, statusLabels: { ...DEFAULT_COPY.statusLabels, ...copy?.statusLabels } }
  const embedFetch = useEmbedFetch(apiBaseUrl, embedClientId)

  const [tab, setTab] = useState<Tab>("overview")
  const [overview, setOverview] = useState<Overview | null>(null)
  const [live, setLive] = useState<LiveMatches | null>(null)
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [players, setPlayers] = useState<Players | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revoked, setRevoked] = useState<string | null>(null)
  const loadedTabs = useRef(new Set<Tab>())

  const loadOverview = useCallback(() => {
    embedFetch<Overview>(`/embed/tournaments/${tournamentCode}`)
      .then(setOverview)
      .catch(() => setError(c.loadError))
  }, [embedFetch, tournamentCode, c.loadError])

  const loadLive = useCallback(() => {
    embedFetch<LiveMatches>(`/embed/tournaments/${tournamentCode}/live`)
      .then(setLive)
      .catch(() => setError(c.loadError))
  }, [embedFetch, tournamentCode, c.loadError])

  const loadBracket = useCallback(() => {
    embedFetch<Bracket>(`/embed/tournaments/${tournamentCode}/bracket`)
      .then(setBracket)
      .catch(() => setError(c.loadError))
  }, [embedFetch, tournamentCode, c.loadError])

  const loadPlayers = useCallback(() => {
    embedFetch<Players>(`/embed/tournaments/${tournamentCode}/players`)
      .then(setPlayers)
      .catch(() => setError(c.loadError))
  }, [embedFetch, tournamentCode, c.loadError])

  // Overview + live load up front (overview drives the header; live is the default focus).
  useEffect(() => {
    loadedTabs.current.add("overview")
    loadedTabs.current.add("live")
    loadOverview()
    loadLive()
  }, [loadOverview, loadLive])

  useEffect(() => {
    if (loadedTabs.current.has(tab)) return
    loadedTabs.current.add(tab)
    if (tab === "bracket") loadBracket()
    if (tab === "players") loadPlayers()
  }, [tab, loadBracket, loadPlayers])

  // Live updates via SSE — refetch only what changed, per the documented event types.
  useEffect(() => {
    const es = new EventSource(
      `${apiBaseUrl}/embed/updates?tournament=${encodeURIComponent(tournamentCode)}&clientId=${encodeURIComponent(embedClientId)}`
    )
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as { type?: string }
        if (data.type === "match_updated") loadLive()
        if (data.type === "groups_regenerated" || data.type === "knockout_generated") loadBracket()
        if (data.type === "roster_updated") loadPlayers()
        if (data.type === "tournament_finished") loadOverview()
        if (data.type === "sse_revoked") setRevoked((data as { reason?: string }).reason ?? "revoked")
      } catch {
        // ignore malformed frames — heartbeat/unknown events are harmless
      }
    }
    return () => es.close()
  }, [apiBaseUrl, embedClientId, tournamentCode, loadLive, loadBracket, loadPlayers, loadOverview])

  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{overview?.name ?? tournamentCode}</h2>
          {overview ? (
            <p className="text-sm text-muted-foreground">
              {new Date(overview.startDate).toLocaleDateString()}
              {overview.location ? ` · ${overview.location}` : ""}
              {` · ${overview.playerCount}/${overview.maxPlayers} ${c.players}`}
            </p>
          ) : null}
        </div>
        {overview ? (
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {c.statusLabels[overview.status] ?? overview.status}
          </span>
        ) : null}
      </div>

      {revoked ? (
        <p className="rounded-lg border border-dashed border-border/60 bg-background/50 p-3 text-sm text-muted-foreground">
          {c.loadError}
        </p>
      ) : null}
      {error && !overview ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            ["overview", c.tabOverview],
            ["live", c.tabLive],
            ["bracket", c.tabBracket],
            ["players", c.tabPlayers],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              tab === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-2 text-sm text-foreground">
          {overview?.description ? <p>{overview.description}</p> : null}
          {!overview ? <p className="text-muted-foreground">{c.loading}</p> : null}
        </div>
      ) : null}

      {tab === "live" ? (
        <div className="space-y-6">
          <MatchList title={null} matches={live?.live} emptyLabel={c.liveEmpty} c={c} highlight />
          <MatchList title={c.upcomingHeading} matches={live?.upcoming} c={c} />
          <MatchList title={c.recentHeading} matches={live?.recent} c={c} />
          {!live ? <p className="text-sm text-muted-foreground">{c.loading}</p> : null}
        </div>
      ) : null}

      {tab === "bracket" ? (
        <div className="space-y-6 overflow-x-auto">
          {!bracket ? <p className="text-sm text-muted-foreground">{c.loading}</p> : null}
          {bracket && bracket.rounds.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c.bracketEmpty}</p>
          ) : null}
          {bracket?.rounds.map((round) => (
            <div key={round.round} className="min-w-[220px] space-y-2">
              <h3 className="text-sm font-semibold text-foreground">
                {round.round}. {c.tabBracket}
              </h3>
              <div className="space-y-2">
                {round.matches.map((m, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_auto] gap-x-3 rounded-lg border border-border/60 bg-background/50 p-2 text-sm"
                  >
                    <span className={m.status === "finished" ? "text-muted-foreground" : "text-foreground"}>
                      {m.player1Name ?? "—"}
                    </span>
                    <span className="tabular-nums text-foreground">{m.player1LegsWon ?? "-"}</span>
                    <span className={m.status === "finished" ? "text-muted-foreground" : "text-foreground"}>
                      {m.player2Name ?? "—"}
                    </span>
                    <span className="tabular-nums text-foreground">{m.player2LegsWon ?? "-"}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "players" ? (
        <div className="space-y-4">
          {!players ? <p className="text-sm text-muted-foreground">{c.loading}</p> : null}
          {players ? (
            <>
              <div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">
                  {c.playersHeading} ({players.players.length})
                </h3>
                <ul className="grid grid-cols-2 gap-1.5 text-sm text-foreground sm:grid-cols-3">
                  {players.players.map((p) => (
                    <li key={p.id} className="truncate rounded-lg bg-muted/40 px-2 py-1">
                      {p.displayName}
                    </li>
                  ))}
                </ul>
              </div>
              {players.waitingListCount > 0 ? (
                <p className="text-sm text-muted-foreground">
                  {c.waitingHeading}: {players.waitingListCount}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function MatchList({
  title,
  matches,
  emptyLabel,
  c,
  highlight,
}: {
  title: string | null
  matches?: MatchItem[]
  emptyLabel?: string
  c: TDartsEmbedCopy
  highlight?: boolean
}) {
  if (matches && matches.length === 0 && !emptyLabel) return null
  return (
    <div>
      {title ? <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3> : null}
      {matches && matches.length === 0 && emptyLabel ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : null}
      <div className="space-y-2">
        {matches?.map((m) => (
          <div
            key={m.matchId}
            className={cn(
              "flex items-center justify-between rounded-lg border p-2.5 text-sm",
              highlight && m.status === "ongoing"
                ? "border-primary/40 bg-primary/5"
                : "border-border/60 bg-background/50"
            )}
          >
            <span className="text-muted-foreground">#{m.boardNumber}</span>
            <span className="flex-1 truncate px-3 text-foreground">
              {m.player1Name} <span className="tabular-nums">{m.player1LegsWon}</span> –{" "}
              <span className="tabular-nums">{m.player2LegsWon}</span> {m.player2Name}
            </span>
            <span className="text-xs text-muted-foreground">{c.statusLabels[m.status] ?? m.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

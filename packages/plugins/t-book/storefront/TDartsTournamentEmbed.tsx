"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@wse/core/lib/utils"
import {
  TDARTS_BADGE_TONE_CLASSES,
  TDARTS_STATUS_TONE_CLASSES,
  tdartsBoardTypeLabel,
  tdartsFormatLabel,
  tdartsParticipationModeInfo,
  tdartsStatusInfo,
} from "../lib/tdarts-format-labels"

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
  locale?: string
  copy?: Partial<TDartsEmbedCopy>
}

type TDartsEmbedCopy = {
  tabOverview: string
  tabLive: string
  tabGroups: string
  tabBracket: string
  tabPlayers: string
  loading: string
  loadError: string
  liveEmpty: string
  upcomingHeading: string
  recentHeading: string
  bracketEmpty: string
  groupsEmpty: string
  groupLabel: string
  playersHeading: string
  waitingHeading: string
  players: string
  entryFeeLabel: string
  freeEntry: string
  registrationDeadlineLabel: string
  statusLabels: Record<string, string>
  standingsRank: string
  standingsName: string
  standingsRecord: string
  standingsLegs: string
  standingsAvg: string
}

const DEFAULT_COPY_HU: TDartsEmbedCopy = {
  tabOverview: "Áttekintés",
  tabLive: "Élő",
  tabGroups: "Csoportok",
  tabBracket: "Egyenes kiesés",
  tabPlayers: "Nevezettek",
  loading: "Betöltés…",
  loadError: "A torna adatai jelenleg nem érhetők el.",
  liveEmpty: "Jelenleg nincs élő mérkőzés.",
  upcomingHeading: "Következő mérkőzések",
  recentHeading: "Legutóbbi eredmények",
  bracketEmpty: "Az egyenes kieséses tábla még nem generált.",
  groupsEmpty: "A csoportok még nem generáltak.",
  groupLabel: "Csoport",
  playersHeading: "Nevezettek",
  waitingHeading: "Várólista",
  players: "fő",
  entryFeeLabel: "Nevezési díj",
  freeEntry: "Ingyenes",
  registrationDeadlineLabel: "Nevezési határidő",
  statusLabels: { pending: "Váró", ongoing: "Folyamatban", finished: "Vége" },
  standingsRank: "#",
  standingsName: "Név",
  standingsRecord: "GY-V",
  standingsLegs: "Legek",
  standingsAvg: "Átlag",
}

const DEFAULT_COPY_EN: TDartsEmbedCopy = {
  tabOverview: "Overview",
  tabLive: "Live",
  tabGroups: "Groups",
  tabBracket: "Knockout",
  tabPlayers: "Players",
  loading: "Loading…",
  loadError: "Tournament data is currently unavailable.",
  liveEmpty: "No live matches right now.",
  upcomingHeading: "Upcoming matches",
  recentHeading: "Recent results",
  bracketEmpty: "The knockout bracket hasn't been generated yet.",
  groupsEmpty: "The groups haven't been generated yet.",
  groupLabel: "Group",
  playersHeading: "Players",
  waitingHeading: "Waiting list",
  players: "players",
  entryFeeLabel: "Entry fee",
  freeEntry: "Free",
  registrationDeadlineLabel: "Registration deadline",
  statusLabels: { pending: "Pending", ongoing: "In progress", finished: "Finished" },
  standingsRank: "#",
  standingsName: "Name",
  standingsRecord: "W-L",
  standingsLegs: "Legs",
  standingsAvg: "Avg",
}

function defaultCopyFor(locale?: string): TDartsEmbedCopy {
  return locale?.startsWith("hu") ? DEFAULT_COPY_HU : DEFAULT_COPY_EN
}

type ClubSummary = { id: string; name: string; location: string | null }
type VisitorInfo = { boardType?: "steel" | "soft" | null }

type Overview = {
  name: string
  status: string
  format: string
  participationMode: string
  openness: string
  startDate: string
  registrationDeadline: string | null
  location: string | null
  county: string | null
  playerCount: number
  maxPlayers: number
  entryFee: number
  entryFeeCurrency: string
  description: string | null
  club: ClubSummary | null
  visitorInfo: VisitorInfo | null
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

type BracketPanel = { bracketId: string; label: string; rounds: { round: number; matches: BracketMatch[] }[] }
type Bracket = { rounds: { round: number; bracketId?: string; matches: BracketMatch[] }[]; brackets?: BracketPanel[] }

type GroupPlayer = {
  id: string
  displayName: string
  rank?: number
  matchesWon?: number
  matchesLost?: number
  legsWon?: number
  legsLost?: number
  avg?: number
}

type Group = { id: string; board: number; matches: MatchItem[]; players: GroupPlayer[] }
type Groups = { groups: Group[] }

type PlayerRow = { id: string; displayName: string; avatarUrl: string | null }
type Players = { players: PlayerRow[]; waitingListCount: number }

type Tab = "overview" | "live" | "groups" | "bracket" | "players"

function isPlaceholderName(name: string | null | undefined): boolean {
  return name === "BYE" || name === "TBD" || !name
}

function normalizeFormat(format: string | null | undefined): string {
  return String(format ?? "").trim().toLowerCase().replace(/[-\s]+/g, "_")
}

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
  locale,
  copy,
}: TDartsTournamentEmbedProps) {
  const defaultCopy = defaultCopyFor(locale)
  const c = { ...defaultCopy, ...copy, statusLabels: { ...defaultCopy.statusLabels, ...copy?.statusLabels } }
  const embedFetch = useEmbedFetch(apiBaseUrl, embedClientId)

  const [tab, setTab] = useState<Tab>("overview")
  const [overview, setOverview] = useState<Overview | null>(null)
  const [live, setLive] = useState<LiveMatches | null>(null)
  const [groups, setGroups] = useState<Groups | null>(null)
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [players, setPlayers] = useState<Players | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revoked, setRevoked] = useState<string | null>(null)
  const loadedTabs = useRef(new Set<Tab>())
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set([0]))

  const format = normalizeFormat(overview?.format)
  const showGroupsTab = format === "group" || format === "group_knockout"
  const showBracketTab = !overview || format === "knockout" || format === "group_knockout"

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

  const loadGroups = useCallback(() => {
    embedFetch<Groups>(`/embed/tournaments/${tournamentCode}/groups`)
      .then(setGroups)
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

  // Overview + live load up front (overview drives the header/badges + tab visibility; live is the default focus).
  useEffect(() => {
    loadedTabs.current.add("overview")
    loadedTabs.current.add("live")
    loadOverview()
    loadLive()
  }, [loadOverview, loadLive])

  useEffect(() => {
    if (loadedTabs.current.has(tab)) return
    loadedTabs.current.add(tab)
    if (tab === "groups") loadGroups()
    if (tab === "bracket") loadBracket()
    if (tab === "players") loadPlayers()
  }, [tab, loadGroups, loadBracket, loadPlayers])

  // Live updates via SSE — refetch only what changed, per the documented event types.
  useEffect(() => {
    const es = new EventSource(
      `${apiBaseUrl}/embed/updates?tournament=${encodeURIComponent(tournamentCode)}&clientId=${encodeURIComponent(embedClientId)}`
    )
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string) as { type?: string }
        if (data.type === "match_updated") {
          loadLive()
          if (loadedTabs.current.has("groups")) loadGroups()
          if (loadedTabs.current.has("bracket")) loadBracket()
        }
        if (data.type === "groups_regenerated") {
          if (loadedTabs.current.has("groups")) loadGroups()
        }
        if (data.type === "knockout_generated") {
          if (loadedTabs.current.has("bracket")) loadBracket()
        }
        if (data.type === "roster_updated") {
          if (loadedTabs.current.has("players")) loadPlayers()
        }
        if (data.type === "tournament_finished") loadOverview()
        if (data.type === "sse_revoked") setRevoked((data as { reason?: string }).reason ?? "revoked")
      } catch {
        // ignore malformed frames — heartbeat/unknown events are harmless
      }
    }
    return () => es.close()
  }, [apiBaseUrl, embedClientId, tournamentCode, loadLive, loadGroups, loadBracket, loadPlayers, loadOverview])

  const formatLabel = tdartsFormatLabel(overview?.format, locale)
  const participationInfo = tdartsParticipationModeInfo(overview?.participationMode, locale)
  const boardTypeLabel = tdartsBoardTypeLabel(overview?.visitorInfo?.boardType, locale)
  const statusInfo = overview ? tdartsStatusInfo(overview.status, locale) : null

  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-4 shadow-sm sm:p-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">{overview?.name ?? tournamentCode}</h2>
          {overview ? (
            <p className="text-sm text-muted-foreground">
              {new Date(overview.startDate).toLocaleDateString()}
              {overview.club?.name ? ` · ${overview.club.name}` : ""}
              {overview.location ? ` · ${overview.location}` : ""}
              {` · ${overview.playerCount}/${overview.maxPlayers} ${c.players}`}
            </p>
          ) : null}
        </div>
        {statusInfo ? (
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium",
              TDARTS_STATUS_TONE_CLASSES[statusInfo.tone]
            )}
          >
            {statusInfo.label}
          </span>
        ) : null}
      </div>

      {overview ? (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {formatLabel ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                TDARTS_BADGE_TONE_CLASSES.primary
              )}
            >
              {formatLabel}
            </span>
          ) : null}
          {participationInfo ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                TDARTS_BADGE_TONE_CLASSES[participationInfo.tone]
              )}
            >
              {participationInfo.label}
            </span>
          ) : null}
          {boardTypeLabel ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                TDARTS_BADGE_TONE_CLASSES.muted
              )}
            >
              {boardTypeLabel}
            </span>
          ) : null}
        </div>
      ) : null}

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
            ...(showGroupsTab ? [["groups", c.tabGroups] as [Tab, string]] : []),
            ...(showBracketTab ? [["bracket", c.tabBracket] as [Tab, string]] : []),
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
        <div className="space-y-3 text-sm text-foreground">
          {overview?.description ? <p>{overview.description}</p> : null}
          {overview ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-border/60 bg-background/50 p-3 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">{c.entryFeeLabel}</dt>
                <dd className="font-medium">
                  {overview.entryFee > 0
                    ? `${overview.entryFee.toLocaleString()} ${overview.entryFeeCurrency}`
                    : c.freeEntry}
                </dd>
              </div>
              {overview.registrationDeadline ? (
                <div>
                  <dt className="text-xs text-muted-foreground">{c.registrationDeadlineLabel}</dt>
                  <dd className="font-medium">{new Date(overview.registrationDeadline).toLocaleDateString()}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
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

      {tab === "groups" ? (
        <div className="space-y-3">
          {!groups ? <p className="text-sm text-muted-foreground">{c.loading}</p> : null}
          {groups && groups.groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">{c.groupsEmpty}</p>
          ) : null}
          {groups?.groups.map((group, gi) => {
            const expanded = expandedGroups.has(gi)
            const label = `${c.groupLabel} ${String.fromCharCode(65 + gi)}`
            const sortedPlayers = [...group.players].sort(
              (a, b) => (a.rank ?? gi + 1) - (b.rank ?? gi + 1)
            )
            return (
              <div key={group.id} className="rounded-lg border border-border/60 bg-background/50">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((prev) => {
                      const next = new Set(prev)
                      if (next.has(gi)) next.delete(gi)
                      else next.add(gi)
                      return next
                    })
                  }
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-foreground"
                >
                  <span>{label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {group.players.length} {c.players}
                  </span>
                </button>
                {expanded ? (
                  <div className="overflow-x-auto border-t border-border/60 px-3 pb-3 pt-2">
                    <table className="w-full min-w-[320px] text-left text-xs">
                      <thead>
                        <tr className="text-muted-foreground">
                          <th className="w-6 pb-1 font-normal">{c.standingsRank}</th>
                          <th className="pb-1 font-normal">{c.standingsName}</th>
                          <th className="w-14 pb-1 text-right font-normal">{c.standingsRecord}</th>
                          <th className="w-14 pb-1 text-right font-normal">{c.standingsLegs}</th>
                          <th className="w-14 pb-1 text-right font-normal">{c.standingsAvg}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedPlayers.map((p, pi) => (
                          <tr key={p.id} className="border-t border-border/40">
                            <td className="py-1 tabular-nums text-muted-foreground">{p.rank ?? pi + 1}</td>
                            <td className="py-1 text-foreground">{p.displayName}</td>
                            <td className="py-1 text-right tabular-nums text-foreground">
                              {p.matchesWon ?? 0}-{p.matchesLost ?? 0}
                            </td>
                            <td className="py-1 text-right tabular-nums text-foreground">
                              {p.legsWon ?? 0}-{p.legsLost ?? 0}
                            </td>
                            <td className="py-1 text-right tabular-nums text-foreground">
                              {p.avg != null ? p.avg.toFixed(1) : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      {tab === "bracket" ? (
        <div className="space-y-8 overflow-x-auto">
          {!bracket ? <p className="text-sm text-muted-foreground">{c.loading}</p> : null}
          {bracket && bracket.rounds.length === 0 && (!bracket.brackets || bracket.brackets.length === 0) ? (
            <p className="text-sm text-muted-foreground">{c.bracketEmpty}</p>
          ) : null}
          {(bracket?.brackets && bracket.brackets.length > 0
            ? bracket.brackets
            : bracket
              ? [{ bracketId: "main", label: c.tabBracket, rounds: bracket.rounds }]
              : []
          ).map((panel) => (
            <div key={panel.bracketId} className="space-y-4">
              {bracket?.brackets && bracket.brackets.length > 1 ? (
                <h3 className="text-sm font-semibold text-foreground">{panel.label}</h3>
              ) : null}
              <div className="flex gap-4">
                {panel.rounds.map((round) => (
                  <div key={round.round} className="min-w-[220px] space-y-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {round.round}. {c.tabBracket}
                    </h4>
                    <div className="space-y-2">
                      {round.matches.map((m, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-[1fr_auto] gap-x-3 rounded-lg border border-border/60 bg-background/50 p-2 text-sm"
                        >
                          <span
                            className={
                              m.status === "finished" || isPlaceholderName(m.player1Name)
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }
                          >
                            {isPlaceholderName(m.player1Name) ? "—" : m.player1Name}
                          </span>
                          <span className="tabular-nums text-foreground">{m.player1LegsWon ?? "-"}</span>
                          <span
                            className={
                              m.status === "finished" || isPlaceholderName(m.player2Name)
                                ? "text-muted-foreground"
                                : "text-foreground"
                            }
                          >
                            {isPlaceholderName(m.player2Name) ? "—" : m.player2Name}
                          </span>
                          <span className="tabular-nums text-foreground">{m.player2LegsWon ?? "-"}</span>
                        </div>
                      ))}
                    </div>
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

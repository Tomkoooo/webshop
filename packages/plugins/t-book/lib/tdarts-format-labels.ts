/**
 * Label/tone mapping for tDarts' tournament format, participation mode,
 * status and board-type values — mirrors tDarts' own badge conventions
 * (apps/web/src/components/shared/tournament-format-badges.tsx and
 * apps/web/src/lib/tournament/card-status.ts in tdarts_torunament) so a
 * WDF card reads the same way a tdarts.hu search card does. The API
 * returns these as free strings (not narrowed unions), so every mapper
 * here normalizes case/separators before matching and falls back
 * gracefully for anything unrecognized.
 */

export type TDartsBadgeTone = "muted" | "primary" | "violet" | "fuchsia" | "emerald" | "indigo" | "sky" | "amber"

function normalize(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase().replace(/[-\s]+/g, "_")
}

export function tdartsFormatLabel(format: string | null | undefined, locale?: string): string | null {
  const hu = locale?.startsWith("hu")
  switch (normalize(format)) {
    case "group":
      return hu ? "Csoportkör" : "Group stage"
    case "knockout":
      return hu ? "Egyenes kiesés" : "Knockout"
    case "group_knockout":
      return hu ? "Csoportkör + egyenes kiesés" : "Group stage + knockout"
    default:
      return null
  }
}

export function tdartsParticipationModeInfo(
  mode: string | null | undefined,
  locale?: string
): { label: string; tone: TDartsBadgeTone } | null {
  const hu = locale?.startsWith("hu")
  switch (normalize(mode)) {
    case "individual":
      return { label: hu ? "Egyéni" : "Singles", tone: "muted" }
    case "pair":
      return { label: hu ? "Páros" : "Doubles", tone: "violet" }
    case "lucky_pairs":
      return { label: hu ? "Lucky páros" : "Lucky doubles", tone: "fuchsia" }
    case "team":
      return { label: hu ? "Csapat" : "Team", tone: "emerald" }
    case "swiss":
      return { label: hu ? "Svájci rendszer" : "Swiss system", tone: "indigo" }
    default:
      return null
  }
}

export function tdartsOpennessLabel(openness: string | null | undefined, locale?: string): string | null {
  const hu = locale?.startsWith("hu")
  switch (normalize(openness)) {
    case "open":
      return hu ? "Nyílt" : "Open"
    case "amateur":
      return hu ? "Amatőr" : "Amateur"
    default:
      return null
  }
}

export function tdartsBoardTypeLabel(boardType: string | null | undefined, locale?: string): string | null {
  const hu = locale?.startsWith("hu")
  switch (normalize(boardType)) {
    case "steel":
      return hu ? "Acél céltábla" : "Steel tip"
    case "soft":
      return hu ? "Soft céltábla" : "Soft tip"
    default:
      return null
  }
}

export type TDartsStatusTone = "live" | "upcoming" | "finished"

const LIVE_STATUSES = new Set(["active", "in_progress", "live", "group_stage", "knockout"])
const FINISHED_STATUSES = new Set(["finished", "cancelled"])

/** Mirrors tDarts' own card-status mapping (raw domain status -> LIVE/UPCOMING/FINISHED). */
export function tdartsStatusInfo(
  status: string | null | undefined,
  locale?: string
): { label: string; tone: TDartsStatusTone } {
  const hu = locale?.startsWith("hu")
  const key = normalize(status)
  if (FINISHED_STATUSES.has(key)) return { label: hu ? "Lezárult" : "Finished", tone: "finished" }
  if (LIVE_STATUSES.has(key)) return { label: hu ? "Élő" : "Live", tone: "live" }
  return { label: hu ? "Hamarosan" : "Upcoming", tone: "upcoming" }
}

export const TDARTS_BADGE_TONE_CLASSES: Record<TDartsBadgeTone, string> = {
  muted: "border-border bg-muted text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  violet: "border-violet-500/30 bg-violet-500/10 text-violet-700",
  fuchsia: "border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700",
  emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700",
  sky: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  amber: "border-amber-500/30 bg-amber-500/10 text-amber-800",
}

export const TDARTS_STATUS_TONE_CLASSES: Record<TDartsStatusTone, string> = {
  live: "border-destructive/30 bg-destructive/10 text-destructive animate-pulse",
  upcoming: "border-primary/30 bg-primary/10 text-primary",
  finished: "border-border bg-muted text-muted-foreground",
}

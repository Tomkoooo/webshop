import type { TBookPackageDeal } from "./pricing-types"

export type StayDateSource = {
  startDate: Date | string
  endDate: Date | string
}

export type StayRecommendation = {
  /** Earliest event start (ISO date midnight local interpretation via Date). */
  startDate: Date
  /** Latest event end. */
  endDate: Date
  /** Calendar nights covering the stay window (min 1). */
  nights: number
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

/** Calendar nights between two dates (min 1). Client-safe — no mongoose imports. */
export function stayNightsBetween(startDate: Date | string, endDate: Date | string): number {
  const ms = toDate(endDate).getTime() - toDate(startDate).getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}

/** Recommend a stay window that covers one or more events' calendar dates. */
export function recommendStayForEvents(events: StayDateSource[]): StayRecommendation {
  if (events.length === 0) {
    const now = new Date()
    return { startDate: now, endDate: now, nights: 1 }
  }
  let start = toDate(events[0].startDate)
  let end = toDate(events[0].endDate)
  for (let i = 1; i < events.length; i++) {
    const s = toDate(events[i].startDate)
    const e = toDate(events[i].endDate)
    if (s.getTime() < start.getTime()) start = s
    if (e.getTime() > end.getTime()) end = e
  }
  return {
    startDate: start,
    endDate: end,
    nights: stayNightsBetween(start, end),
  }
}

/** Pick the package whose night count matches the recommendation (nearest if none exact). */
export function preferPackageMatchingNights<T extends Pick<TBookPackageDeal, "nights" | "sortOrder">>(
  packages: T[],
  recommendedNights: number
): T | null {
  if (packages.length === 0) return null
  const sorted = [...packages].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
  const exact = sorted.filter((p) => p.nights === recommendedNights)
  if (exact.length > 0) return exact[0]
  let best = sorted[0]
  let bestDelta = Math.abs(best.nights - recommendedNights)
  for (const pkg of sorted.slice(1)) {
    const delta = Math.abs(pkg.nights - recommendedNights)
    if (delta < bestDelta) {
      best = pkg
      bestDelta = delta
    }
  }
  return best
}

/** Format a short HU date range for stay recommendation copy. */
export function formatStayDateRange(start: Date, end: Date, locale = "hu-HU"): string {
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  const startLabel = start.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  })
  if (sameDay) return startLabel
  const endLabel = end.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  })
  return `${startLabel} – ${endLabel}`
}

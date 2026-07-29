import type { TBookPackageDeal } from "./pricing-types"
import { toBcp47DateLocale } from "./event-schedule"

export type StayDateSource = {
  startDate: Date | string
  endDate: Date | string
  id?: string
  name?: string
}

export type StayRecommendationOptions = {
  /** Add one calendar night after the last event end (leave the morning after). */
  extraNightAfter?: boolean
}

export type StayRecommendation = {
  startDate: Date
  endDate: Date
  /** Calendar nights covering the stay window (min 1). */
  nights: number
  extraNightAfter: boolean
}

export type StayCluster<T extends StayDateSource = StayDateSource> = {
  id: string
  events: T[]
  stay: StayRecommendation
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime())
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

/** Calendar nights between two dates (min 1). Client-safe — no mongoose imports. */
export function stayNightsBetween(startDate: Date | string, endDate: Date | string): number {
  const ms = toDate(endDate).getTime() - toDate(startDate).getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}

/** Days between end of A and start of B (can be negative if overlapping). */
export function gapDaysBetween(earlierEnd: Date | string, laterStart: Date | string): number {
  const ms = toDate(laterStart).getTime() - toDate(earlierEnd).getTime()
  return Math.round(ms / 86_400_000)
}

/** Recommend a stay window that covers one or more events' calendar dates. */
export function recommendStayForEvents(
  events: StayDateSource[],
  options: StayRecommendationOptions = {}
): StayRecommendation {
  const extraNightAfter = Boolean(options.extraNightAfter)
  if (events.length === 0) {
    const now = new Date()
    return { startDate: now, endDate: now, nights: 1, extraNightAfter }
  }
  let start = toDate(events[0].startDate)
  let end = toDate(events[0].endDate)
  for (let i = 1; i < events.length; i++) {
    const s = toDate(events[i].startDate)
    const e = toDate(events[i].endDate)
    if (s.getTime() < start.getTime()) start = s
    if (e.getTime() > end.getTime()) end = e
  }
  const stayEnd = extraNightAfter ? addDays(end, 1) : end
  const baseNights = stayNightsBetween(start, end)
  return {
    startDate: start,
    endDate: stayEnd,
    nights: baseNights + (extraNightAfter ? 1 : 0),
    extraNightAfter,
  }
}

/**
 * Group events into stay clusters when the gap between one event's end and the
 * next event's start is at most `maxGapDays` (default 1 — consecutive/near nights).
 * Example: 21st alone, then 25–26 together.
 */
export function suggestStayClusters<T extends StayDateSource>(
  events: T[],
  options: StayRecommendationOptions & { maxGapDays?: number } = {}
): StayCluster<T>[] {
  const maxGapDays = options.maxGapDays ?? 1
  if (events.length === 0) return []

  const sorted = [...events].sort(
    (a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime()
  )

  const clusters: T[][] = [[sorted[0]]]
  for (let i = 1; i < sorted.length; i++) {
    const prev = clusters[clusters.length - 1]
    const last = prev[prev.length - 1]
    const gap = gapDaysBetween(last.endDate, sorted[i].startDate)
    if (gap <= maxGapDays) {
      prev.push(sorted[i])
    } else {
      clusters.push([sorted[i]])
    }
  }

  return clusters.map((group, index) => ({
    id: `stay-${index + 1}`,
    events: group,
    stay: recommendStayForEvents(group, { extraNightAfter: options.extraNightAfter }),
  }))
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

/** Nearest available stay-length tab when an exact nights package does not exist. */
export function nearestAvailableNights(
  availableNights: number[],
  recommendedNights: number
): number | null {
  if (availableNights.length === 0) return null
  if (availableNights.includes(recommendedNights)) return recommendedNights
  let best = availableNights[0]
  let bestDelta = Math.abs(best - recommendedNights)
  for (const nights of availableNights.slice(1)) {
    const delta = Math.abs(nights - recommendedNights)
    if (delta < bestDelta) {
      best = nights
      bestDelta = delta
    }
  }
  return best
}

/** Format a short date range for stay recommendation copy (month names follow UI locale). */
export function formatStayDateRange(start: Date, end: Date, locale?: string): string {
  const tag = toBcp47DateLocale(locale, "en-GB")
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  const startLabel = start.toLocaleDateString(tag, {
    month: "short",
    day: "numeric",
  })
  if (sameDay) return startLabel
  const endLabel = end.toLocaleDateString(tag, {
    month: "short",
    day: "numeric",
  })
  return `${startLabel} – ${endLabel}`
}

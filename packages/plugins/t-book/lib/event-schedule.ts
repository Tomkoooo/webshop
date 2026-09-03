/** Optional event wall-clock times in 24h `HH:mm` (Europe/Budapest display). */
export const TBOOK_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

export function normalizeEventTime(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim()
  if (!trimmed) return null
  return TBOOK_TIME_PATTERN.test(trimmed) ? trimmed : null
}

export function toTimeInputValue(stored?: string | null): string {
  return normalizeEventTime(stored) ?? ""
}

/** `datetime-local` value in the admin's local timezone. */
export function toDatetimeLocalValue(value?: Date | string | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function datetimeLocalToIso(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

/**
 * Map a site UI locale (`en` / `hu`) to a BCP 47 tag for `toLocaleDateString`.
 * Month/day names follow the visitor language; times stay Budapest wall-clock (`HH:mm`).
 * When `locale` is omitted, keep Hungarian (admin / PDF callers).
 */
export function toBcp47DateLocale(locale?: string, fallback: "hu-HU" | "en-GB" = "hu-HU"): string {
  if (!locale) return fallback
  const normalized = locale.trim().toLowerCase().replace("_", "-")
  if (normalized === "en" || normalized.startsWith("en-")) return "en-GB"
  if (normalized === "hu" || normalized.startsWith("hu-")) return "hu-HU"
  return fallback
}

export function formatEventDatePart(date: Date | string, locale?: string): string {
  return new Date(date).toLocaleDateString(toBcp47DateLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Date with optional Budapest wall-clock time, e.g. "15 October 2026, 09:00" / "2026. október 15., 09:00" */
export function formatEventDateTime(
  date: Date | string,
  time: string | null | undefined,
  locale?: string
): string {
  const datePart = formatEventDatePart(date, locale)
  const normalized = normalizeEventTime(time)
  return normalized ? `${datePart}, ${normalized}` : datePart
}

export function formatEventSchedule(
  startDate: Date | string,
  endDate: Date | string,
  startTime?: string | null,
  endTime?: string | null,
  locale?: string
): string {
  return `${formatEventDateTime(startDate, startTime, locale)} – ${formatEventDateTime(endDate, endTime, locale)}`
}

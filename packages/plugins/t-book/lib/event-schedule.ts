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

export function formatEventDatePart(date: Date | string, locale = "hu-HU"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/** Date with optional time, e.g. "2026. július 15., 09:00" */
export function formatEventDateTime(
  date: Date | string,
  time: string | null | undefined,
  locale = "hu-HU"
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
  locale = "hu-HU"
): string {
  return `${formatEventDateTime(startDate, startTime, locale)} – ${formatEventDateTime(endDate, endTime, locale)}`
}

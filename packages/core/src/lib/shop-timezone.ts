/** Calendar dates for admin filters use the shop's local timezone (Hungary). */
export const SHOP_TIMEZONE = "Europe/Budapest"

export function parseIsoCalendarDay(day: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const dayNum = Number(match[3])
  if (!Number.isFinite(year) || month < 1 || month > 12 || dayNum < 1 || dayNum > 31) {
    return null
  }
  return { year, month, day: dayNum }
}

function getShopTimezoneOffsetMs(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SHOP_TIMEZONE,
    timeZoneName: "longOffset",
  }).formatToParts(instant)
  const tzName = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+1"
  const match = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(tzName)
  if (!match) return 3_600_000
  const sign = match[1] === "-" ? -1 : 1
  const hours = Number(match[2])
  const minutes = Number(match[3] || 0)
  return sign * (hours * 60 + minutes) * 60 * 1000
}

function shopLocalTimeToUtc(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  millisecond: number
): Date {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second, millisecond)
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = getShopTimezoneOffsetMs(new Date(utcMs))
    utcMs = Date.UTC(year, month - 1, day, hour, minute, second, millisecond) - offset
  }
  return new Date(utcMs)
}

export function shopDayStartUtc(isoDay: string): Date | null {
  const parts = parseIsoCalendarDay(isoDay)
  if (!parts) return null
  return shopLocalTimeToUtc(parts.year, parts.month, parts.day, 0, 0, 0, 0)
}

export function shopDayEndUtc(isoDay: string): Date | null {
  const parts = parseIsoCalendarDay(isoDay)
  if (!parts) return null
  return shopLocalTimeToUtc(parts.year, parts.month, parts.day, 23, 59, 59, 999)
}

export function shopDateRangeUtc(
  from?: string,
  to?: string
): { $gte?: Date; $lte?: Date } {
  const range: { $gte?: Date; $lte?: Date } = {}
  if (from) {
    const start = shopDayStartUtc(from)
    if (start) range.$gte = start
  }
  if (to) {
    const end = shopDayEndUtc(to)
    if (end) range.$lte = end
  }
  return range
}

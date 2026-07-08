import {
  endOfDay,
  endOfWeek,
  format,
  startOfDay,
  startOfMonth,
  startOfWeek,
  differenceInCalendarDays,
  parseISO,
  isValid,
} from "date-fns"
import { hu } from "date-fns/locale"

export type AdminStatsDatePreset = "today" | "week" | "month" | "custom"

export type AdminStatsDateRangeSearchParams = {
  preset?: string
  dateFrom?: string
  dateTo?: string
}

export type ResolvedAdminStatsDateRange = {
  preset: AdminStatsDatePreset
  dateFrom: string
  dateTo: string
  label: string
  start: Date
  end: Date
}

const MAX_RANGE_DAYS = 366

const DATE_KEY_FORMAT = "yyyy-MM-dd"

function toDateKey(date: Date): string {
  return format(date, DATE_KEY_FORMAT)
}

function formatDisplayDate(date: Date): string {
  return format(date, "yyyy.MM.dd", { locale: hu })
}

function buildRangeLabel(dateFrom: Date, dateTo: Date): string {
  const fromLabel = formatDisplayDate(dateFrom)
  const toLabel = formatDisplayDate(dateTo)
  if (fromLabel === toLabel) return fromLabel
  return `${fromLabel} – ${toLabel}`
}

function parseDateInput(value: string | undefined): Date | null {
  if (!value?.trim()) return null
  const parsed = parseISO(value.trim())
  return isValid(parsed) ? parsed : null
}

function assertValidRange(start: Date, end: Date): void {
  if (start > end) {
    throw new Error("A kezdő dátum nem lehet későbbi a záró dátumnál.")
  }
  const span = differenceInCalendarDays(end, start)
  if (span > MAX_RANGE_DAYS) {
    throw new Error(`A megadott időszak legfeljebb ${MAX_RANGE_DAYS} nap lehet.`)
  }
}

export function resolveAdminStatsDateRange(
  searchParams: AdminStatsDateRangeSearchParams = {},
  now: Date = new Date()
): ResolvedAdminStatsDateRange {
  const presetParam = searchParams.preset?.trim() || "today"
  const preset: AdminStatsDatePreset =
    presetParam === "week" || presetParam === "month" || presetParam === "custom"
      ? presetParam
      : "today"

  let start: Date
  let end: Date

  if (preset === "today") {
    start = startOfDay(now)
    end = endOfDay(now)
  } else if (preset === "week") {
    start = startOfWeek(now, { weekStartsOn: 1 })
    end = endOfWeek(now, { weekStartsOn: 1 })
  } else if (preset === "month") {
    start = startOfMonth(now)
    end = endOfDay(now)
  } else {
    const from = parseDateInput(searchParams.dateFrom)
    const to = parseDateInput(searchParams.dateTo)
    if (!from || !to) {
      throw new Error("Egyéni időszakhoz meg kell adni a kezdő és záró dátumot.")
    }
    start = startOfDay(from)
    end = endOfDay(to)
  }

  assertValidRange(start, end)

  const dateFrom = toDateKey(start)
  const dateTo = toDateKey(end)

  return {
    preset,
    dateFrom,
    dateTo,
    label: buildRangeLabel(start, end),
    start,
    end,
  }
}

export function buildAdminStatsCreatedAtFilter(range: ResolvedAdminStatsDateRange): {
  $gte: Date
  $lte: Date
} {
  return {
    $gte: range.start,
    $lte: range.end,
  }
}

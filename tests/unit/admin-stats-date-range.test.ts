import { describe, expect, it } from "vitest"
import { format } from "date-fns"
import { resolveAdminStatsDateRange } from "@wse/core/lib/admin-stats-date-range"

const fixedNow = new Date("2026-06-11T15:30:00")

function dateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

describe("resolveAdminStatsDateRange", () => {
  it("defaults to today when no preset is provided", () => {
    const range = resolveAdminStatsDateRange({}, fixedNow)

    expect(range.preset).toBe("today")
    expect(range.dateFrom).toBe("2026-06-11")
    expect(range.dateTo).toBe("2026-06-11")
    expect(range.label).toBe("2026.06.11")
  })

  it("resolves the current calendar week from Monday to Sunday", () => {
    const range = resolveAdminStatsDateRange({ preset: "week" }, fixedNow)

    expect(range.preset).toBe("week")
    expect(range.dateFrom).toBe("2026-06-08")
    expect(range.dateTo).toBe("2026-06-14")
    expect(range.label).toBe("2026.06.08 – 2026.06.14")
  })

  it("resolves month-to-date from the first day of the month through today", () => {
    const range = resolveAdminStatsDateRange({ preset: "month" }, fixedNow)

    expect(range.preset).toBe("month")
    expect(range.dateFrom).toBe("2026-06-01")
    expect(range.dateTo).toBe("2026-06-11")
    expect(range.label).toBe("2026.06.01 – 2026.06.11")
  })

  it("resolves a custom date range", () => {
    const range = resolveAdminStatsDateRange(
      { preset: "custom", dateFrom: "2026-05-01", dateTo: "2026-05-10" },
      fixedNow
    )

    expect(range.preset).toBe("custom")
    expect(range.dateFrom).toBe("2026-05-01")
    expect(range.dateTo).toBe("2026-05-10")
    expect(dateKey(range.start)).toBe("2026-05-01")
    expect(dateKey(range.end)).toBe("2026-05-10")
  })

  it("rejects custom ranges without both dates", () => {
    expect(() =>
      resolveAdminStatsDateRange({ preset: "custom", dateFrom: "2026-05-01" }, fixedNow)
    ).toThrow("Egyéni időszakhoz meg kell adni a kezdő és záró dátumot.")
  })

  it("rejects inverted custom ranges", () => {
    expect(() =>
      resolveAdminStatsDateRange(
        { preset: "custom", dateFrom: "2026-06-10", dateTo: "2026-06-01" },
        fixedNow
      )
    ).toThrow("A kezdő dátum nem lehet későbbi a záró dátumnál.")
  })

  it("rejects custom ranges longer than 366 days", () => {
    expect(() =>
      resolveAdminStatsDateRange(
        { preset: "custom", dateFrom: "2024-01-01", dateTo: "2026-06-11" },
        fixedNow
      )
    ).toThrow("A megadott időszak legfeljebb 366 nap lehet.")
  })
})

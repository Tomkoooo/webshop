import { describe, expect, it } from "vitest"
import {
  eventDateKey,
  formatDateGroupHeading,
  groupByEventDate,
} from "@wse/plugin-t-book/lib/event-schedule"

describe("eventDateKey", () => {
  it("returns a YYYY-MM-DD key in the Europe/Budapest timezone", () => {
    expect(eventDateKey("2026-10-15T09:00:00.000Z")).toBe("2026-10-15")
    // 23:30 UTC on 2026-10-15 is already 2026-10-16 in Budapest (UTC+1 winter / +2 summer)
    expect(eventDateKey("2026-10-15T23:30:00.000Z")).toBe("2026-10-16")
  })
})

describe("groupByEventDate", () => {
  it("buckets items by calendar day, sorted ascending", () => {
    const items = [
      { id: "c", date: "2026-10-17T10:00:00.000Z" },
      { id: "a", date: "2026-10-15T10:00:00.000Z" },
      { id: "b1", date: "2026-10-16T09:00:00.000Z" },
      { id: "b2", date: "2026-10-16T14:00:00.000Z" },
    ]
    const groups = groupByEventDate(items, (i) => i.date)
    expect(groups.map((g) => g.dateKey)).toEqual(["2026-10-15", "2026-10-16", "2026-10-17"])
    expect(groups[1].items.map((i) => i.id)).toEqual(["b1", "b2"])
  })

  it("returns an empty array for no items", () => {
    expect(groupByEventDate([], (i: never) => i)).toEqual([])
  })
})

describe("formatDateGroupHeading", () => {
  it("labels today and tomorrow specially", () => {
    const today = eventDateKey(new Date())
    const tomorrow = eventDateKey(new Date(Date.now() + 86_400_000))
    expect(formatDateGroupHeading(today, "en")).toBe("Today")
    expect(formatDateGroupHeading(tomorrow, "en")).toBe("Tomorrow")
    expect(formatDateGroupHeading(today, "hu")).toBe("Ma")
    expect(formatDateGroupHeading(tomorrow, "hu")).toBe("Holnap")
  })

  it("formats a far-future date as a full localized date", () => {
    const heading = formatDateGroupHeading("2030-05-01", "en")
    expect(heading).toContain("2030")
    expect(heading).toMatch(/May/)
  })
})

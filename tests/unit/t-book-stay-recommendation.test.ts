import { describe, expect, it } from "vitest"
import {
  formatStayDateRange,
  preferPackageMatchingNights,
  recommendStayForEvents,
} from "../../packages/plugins/t-book/lib/stay-recommendation"

describe("recommendStayForEvents", () => {
  it("uses a single event calendar span", () => {
    const stay = recommendStayForEvents([
      { startDate: "2025-10-23T00:00:00.000Z", endDate: "2025-10-23T00:00:00.000Z" },
    ])
    expect(stay.nights).toBe(1)
  })

  it("spans multiple events from earliest start to latest end", () => {
    const stay = recommendStayForEvents([
      { startDate: "2025-10-23T00:00:00.000Z", endDate: "2025-10-23T00:00:00.000Z" },
      { startDate: "2025-10-24T00:00:00.000Z", endDate: "2025-10-25T00:00:00.000Z" },
    ])
    expect(stay.nights).toBe(2)
    expect(stay.startDate.toISOString().startsWith("2025-10-23")).toBe(true)
    expect(stay.endDate.toISOString().startsWith("2025-10-25")).toBe(true)
  })

  it("does not invent a wider festival window for a late single-day event", () => {
    const stay = recommendStayForEvents([
      { startDate: "2025-10-24T00:00:00.000Z", endDate: "2025-10-24T00:00:00.000Z" },
    ])
    expect(stay.nights).toBe(1)
  })
})

describe("preferPackageMatchingNights", () => {
  const packages = [
    { key: "two", nights: 2, sortOrder: 0 },
    { key: "three", nights: 3, sortOrder: 1 },
    { key: "one", nights: 1, sortOrder: 2 },
  ]

  it("prefers an exact nights match", () => {
    expect(preferPackageMatchingNights(packages, 1)?.key).toBe("one")
    expect(preferPackageMatchingNights(packages, 3)?.key).toBe("three")
  })

  it("falls back to nearest nights when no exact match", () => {
    expect(preferPackageMatchingNights(packages, 4)?.key).toBe("three")
  })
})

describe("formatStayDateRange", () => {
  it("formats a single day without a range dash", () => {
    const label = formatStayDateRange(
      new Date("2025-10-23T12:00:00.000Z"),
      new Date("2025-10-23T12:00:00.000Z"),
      "en-US"
    )
    expect(label.includes("–")).toBe(false)
  })
})

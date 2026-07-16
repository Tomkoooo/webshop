import { describe, expect, it } from "vitest"
import {
  formatStayDateRange,
  preferPackageMatchingNights,
  recommendStayForEvents,
  suggestStayClusters,
} from "../../packages/plugins/t-book/lib/stay-recommendation"

describe("recommendStayForEvents", () => {
  it("uses a single event calendar span", () => {
    const stay = recommendStayForEvents([
      { startDate: "2025-10-23T00:00:00.000Z", endDate: "2025-10-23T00:00:00.000Z" },
    ])
    expect(stay.nights).toBe(1)
    expect(stay.extraNightAfter).toBe(false)
  })

  it("spans multiple events from earliest start to latest end", () => {
    const stay = recommendStayForEvents([
      { startDate: "2025-10-23T00:00:00.000Z", endDate: "2025-10-23T00:00:00.000Z" },
      { startDate: "2025-10-24T00:00:00.000Z", endDate: "2025-10-25T00:00:00.000Z" },
    ])
    expect(stay.nights).toBe(2)
  })

  it("adds one night after the tournament when requested", () => {
    const stay = recommendStayForEvents(
      [{ startDate: "2025-10-23T00:00:00.000Z", endDate: "2025-10-23T00:00:00.000Z" }],
      { extraNightAfter: true }
    )
    expect(stay.nights).toBe(2)
    expect(stay.extraNightAfter).toBe(true)
  })
})

describe("suggestStayClusters", () => {
  it("keeps distant events in separate stays (21 vs 25–26)", () => {
    const clusters = suggestStayClusters([
      { id: "a", name: "Day 21", startDate: "2025-10-21T00:00:00.000Z", endDate: "2025-10-21T00:00:00.000Z" },
      { id: "b", name: "Day 25", startDate: "2025-10-25T00:00:00.000Z", endDate: "2025-10-25T00:00:00.000Z" },
      { id: "c", name: "Day 26", startDate: "2025-10-26T00:00:00.000Z", endDate: "2025-10-26T00:00:00.000Z" },
    ])
    expect(clusters).toHaveLength(2)
    expect(clusters[0].events.map((e) => e.id)).toEqual(["a"])
    expect(clusters[1].events.map((e) => e.id)).toEqual(["b", "c"])
    expect(clusters[1].stay.nights).toBe(1)
  })

  it("merges consecutive events into one stay", () => {
    const clusters = suggestStayClusters([
      { id: "a", startDate: "2025-10-24T00:00:00.000Z", endDate: "2025-10-24T00:00:00.000Z" },
      { id: "b", startDate: "2025-10-25T00:00:00.000Z", endDate: "2025-10-25T00:00:00.000Z" },
    ])
    expect(clusters).toHaveLength(1)
    expect(clusters[0].events).toHaveLength(2)
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

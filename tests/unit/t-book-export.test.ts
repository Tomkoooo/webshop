import { describe, expect, it } from "vitest"
import {
  buildBookingCsv,
  buildBookingExportRows,
} from "@wse/plugin-t-book/lib/booking-export"
import type { ITBookBooking } from "@wse/plugin-t-book/models/TBookBooking"

function makeBooking(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    _id: "booking1",
    eventName: "Sakkfesztivál",
    groupName: "Nyár 2026",
    hotelName: "Hotel Panoráma",
    customer: { name: "Kovács Anna", email: "anna@example.com", phone: "+3612345678", note: "" },
    guests: 2,
    nights: 3,
    selections: { room_type: "suite", meals: "half_board", accessibility: true },
    quote: {
      guests: 2,
      nights: 3,
      ticketSubtotalHuf: 20000,
      accommodationBaseHuf: 60000,
      accommodationOptionsHuf: 81000,
      accommodationSubtotalHuf: 141000,
      totalHuf: 161000,
      lines: [],
    },
    totalHuf: 161000,
    status: "paid",
    invoiceStatus: "issued",
    invoiceId: "INV-42",
    createdAt: new Date("2026-07-01T10:00:00Z"),
    paidAt: new Date("2026-07-01T10:05:00Z"),
    ...overrides,
  } as unknown as ITBookBooking
}

describe("booking export", () => {
  it("emits fixed columns plus dynamic selection columns", () => {
    const rows = buildBookingExportRows([makeBooking()])
    expect(rows).toHaveLength(1)
    const row = rows[0]
    expect(row["Kapcsolattartó neve"]).toBe("Kovács Anna")
    expect(row["Opció: room_type"]).toBe("suite")
    expect(row["Opció: meals"]).toBe("half_board")
    expect(row["Opció: accessibility"]).toBe("Igen")
    expect(row["Végösszeg (Ft)"]).toBe("161000")
    expect(row["Számlaszám"]).toBe("INV-42")
    expect(row["Státusz"]).toBe("Fizetve")
  })

  it("unions selection keys across bookings", () => {
    const rows = buildBookingExportRows([
      makeBooking(),
      makeBooking({ selections: { bedding: "twin" }, hotelName: "" }),
    ])
    expect(rows[0]["Opció: bedding"]).toBe("")
    expect(rows[1]["Opció: room_type"]).toBe("")
    expect(rows[1]["Opció: bedding"]).toBe("twin")
    // ticket-only booking has no nights column value
    expect(rows[1]["Éjszakák"]).toBe("")
  })

  it("builds semicolon-delimited CSV with BOM and escaping", () => {
    const csv = buildBookingCsv([
      makeBooking({ customer: { name: 'Nagy "Béla"', email: "b@x.hu", phone: "1", note: "" } }),
    ])
    expect(csv.startsWith("\uFEFF")).toBe(true)
    expect(csv).toContain('"Nagy ""Béla"""')
    const [header, data] = csv.split("\n")
    expect(header.split(";").length).toBe(data.split(";").length)
  })

  it("returns an empty string for no rows", () => {
    expect(buildBookingCsv([])).toBe("")
  })
})

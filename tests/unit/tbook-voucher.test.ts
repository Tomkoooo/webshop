import { describe, expect, it } from "vitest"
import { resolveAttendeeDisplayName } from "../../packages/plugins/t-book/services/voucher-service"
import {
  buildVoucherPdf,
  parseVoucherTokenFromScan,
} from "../../packages/plugins/t-book/lib/voucher-pdf"

describe("resolveAttendeeDisplayName", () => {
  const schema = [
    { key: "full_name", label: "Teljes név", type: "text" as const, sortOrder: 0 },
    { key: "email", label: "E-mail", type: "email" as const, sortOrder: 1 },
  ]

  it("uses name field when present", () => {
    const name = resolveAttendeeDisplayName(
      0,
      [{ fields: { full_name: "Kovács Anna", email: "a@test.hu" } }],
      schema,
      "Teszt Vásárló",
      1
    )
    expect(name).toBe("Kovács Anna")
  })

  it("falls back to customer name for single guest", () => {
    const name = resolveAttendeeDisplayName(0, [{ fields: {} }], schema, "Teszt Vásárló", 1)
    expect(name).toBe("Teszt Vásárló")
  })

  it("appends guest index for multi-guest without name", () => {
    const name = resolveAttendeeDisplayName(1, [{ fields: {} }, { fields: {} }], schema, "Teszt Vásárló", 2)
    expect(name).toBe("Teszt Vásárló (2. vendég)")
  })
})

describe("parseVoucherTokenFromScan", () => {
  const token = "550e8400-e29b-41d4-a716-446655440000"

  it("returns raw token unchanged", () => {
    expect(parseVoucherTokenFromScan(token)).toBe(token)
  })

  it("extracts token from URL path", () => {
    expect(parseVoucherTokenFromScan(`https://example.com/vouchers/${token}`)).toBe(token)
  })

  it("extracts token from query param", () => {
    expect(parseVoucherTokenFromScan(`https://example.com/scan?token=${token}`)).toBe(token)
  })
})

describe("buildVoucherPdf", () => {
  it("produces a valid PDF byte stream", async () => {
    const token = "550e8400-e29b-41d4-a716-446655440000"
    const bytes = await buildVoucherPdf({
      headerImage: "",
      pages: [
        {
          token,
          displayName: "Teszt Vendég",
          attendeeFields: { full_name: "Teszt Vendég" },
          attendeeFieldSchema: [
            { key: "full_name", label: "Teljes név", type: "text", sortOrder: 0 },
          ],
          eventName: "Teszt Esemény",
          startDate: new Date("2026-07-15T10:00:00Z"),
          endDate: new Date("2026-07-15T18:00:00Z"),
          locationAddress: "Budapest, Hungary",
          bookingId: "507f1f77bcf86cd799439011",
          pageIndex: 1,
          pageCount: 1,
        },
      ],
    })

    expect(bytes.length).toBeGreaterThan(1000)
    const header = String.fromCharCode(...bytes.slice(0, 5))
    expect(header).toBe("%PDF-")
  }, 15000)
})

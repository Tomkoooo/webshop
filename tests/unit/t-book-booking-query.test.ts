import { describe, expect, it } from "vitest"
import {
  buildBookingQuery,
  parseBookingFilters,
  TBOOK_BOOKING_PAGE_SIZE_DEFAULT,
  TBOOK_BOOKING_PAGE_SIZE_MAX,
} from "@wse/plugin-t-book/lib/booking-query"

describe("parseBookingFilters", () => {
  it("reads filters and paging from search params", () => {
    const params = new URLSearchParams(
      "search=kovacs&eventId=e1&status=paid&optionKey=room_type&optionValue=suite&page=3&pageSize=50"
    )
    const filters = parseBookingFilters(params)
    expect(filters.search).toBe("kovacs")
    expect(filters.eventId).toBe("e1")
    expect(filters.status).toBe("paid")
    expect(filters.optionKey).toBe("room_type")
    expect(filters.optionValue).toBe("suite")
    expect(filters.page).toBe(3)
    expect(filters.pageSize).toBe(50)
  })

  it("falls back to defaults for bad paging values", () => {
    const filters = parseBookingFilters(new URLSearchParams("page=-1&pageSize=99999"))
    expect(filters.page).toBe(1)
    expect(filters.pageSize).toBe(TBOOK_BOOKING_PAGE_SIZE_MAX)
    const filters2 = parseBookingFilters(new URLSearchParams("page=abc&pageSize=abc"))
    expect(filters2.page).toBe(1)
    expect(filters2.pageSize).toBe(TBOOK_BOOKING_PAGE_SIZE_DEFAULT)
  })
})

describe("buildBookingQuery", () => {
  it("builds an empty query without filters", () => {
    expect(buildBookingQuery({})).toEqual({})
  })

  it("maps id and status filters", () => {
    const query = buildBookingQuery({ eventId: "e1", status: "paid", invoiceStatus: "issued" })
    expect(query.eventId).toBe("e1")
    expect(query.status).toBe("paid")
    expect(query.invoiceStatus).toBe("issued")
  })

  it("filters stored selections by key/value (e.g. 1-bedroom counts)", () => {
    const query = buildBookingQuery({ optionKey: "room_type", optionValue: "1-bedroom" })
    expect(query["selections.room_type"]).toBe("1-bedroom")
  })

  it("ignores option filter without a value", () => {
    const query = buildBookingQuery({ optionKey: "room_type" })
    expect(Object.keys(query)).toEqual([])
  })

  it("builds an inclusive createdAt date range", () => {
    const query = buildBookingQuery({ dateFrom: "2026-07-01", dateTo: "2026-07-31" }) as {
      createdAt: { $gte: Date; $lte: Date }
    }
    expect(query.createdAt.$gte.toISOString().slice(0, 10)).toBe("2026-07-01")
    expect(query.createdAt.$lte.getHours()).toBe(23)
  })

  it("searches across customer and denormalized name fields", () => {
    const query = buildBookingQuery({ search: "kovacs" }) as { $or: Array<Record<string, RegExp>> }
    const keys = query.$or.map((clause) => Object.keys(clause)[0])
    expect(keys).toContain("customer.name")
    expect(keys).toContain("customer.email")
    expect(keys).toContain("eventName")
    expect(keys).toContain("hotelName")
  })

  it("escapes regex metacharacters in search input", () => {
    const query = buildBookingQuery({ search: "a+b(c)" }) as { $or: Array<Record<string, RegExp>> }
    const re = Object.values(query.$or[0])[0]
    expect(re.source).toBe("a\\+b\\(c\\)")
    expect(re.test("a+b(c)")).toBe(true)
  })
})

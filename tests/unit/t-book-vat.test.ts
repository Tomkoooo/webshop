import { describe, expect, it } from "vitest"
import { calculateBookingQuote } from "@wse/plugin-t-book/lib/pricing"
import { mergeOptionSchemas } from "@wse/plugin-t-book/lib/option-merge"
import { toGrossHuf } from "@wse/plugin-t-book/lib/vat"

describe("tBook VAT pricing", () => {
  it("converts net ticket fee to gross with VAT", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 10000,
      ticketFeeMode: "per_person",
      ticketPriceBasis: "net",
      ticketVatPercent: 27,
      guests: 2,
    })
    expect(quote.ticketSubtotalHuf).toBe(toGrossHuf(10000, "net", 27) * 2)
  })

  it("merges group options with hotel options (hotel wins on key clash)", () => {
    const merged = mergeOptionSchemas(
      [{ key: "meals", label: "Étkezés", type: "select", choices: [] }],
      [{ key: "room", label: "Szoba", type: "select", choices: [] }]
    )
    expect(merged.map((o) => o.key).sort()).toEqual(["meals", "room"])
  })
})

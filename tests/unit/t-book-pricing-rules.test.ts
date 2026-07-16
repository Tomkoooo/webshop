import { describe, expect, it } from "vitest"
import { calculateBookingQuote } from "@wse/plugin-t-book/lib/pricing"
import type { TBookPricingRule } from "@wse/plugin-t-book/lib/pricing-rules"

const hotelPricing = {
  priceBasis: "gross" as const,
  vatPercent: 0,
  accommodationMode: "packages" as const,
  roomTypes: [],
  packages: [
    {
      key: "pkg3",
      label: "3 night package",
      nights: 3,
      priceHuf: 500,
      maxGuests: 1,
    },
  ],
}

function rules(partial: Array<Partial<TBookPricingRule> & Pick<TBookPricingRule, "when" | "action">>): TBookPricingRule[] {
  return partial.map((r, i) => ({
    id: r.id ?? `r${i}`,
    enabled: r.enabled !== false,
    label: r.label ?? `Rule ${i}`,
    when: r.when,
    action: r.action,
    amount: r.amount ?? 0,
    amountMode: r.amountMode ?? "fixed",
  }))
}

describe("event pricing rules", () => {
  it("sets free entry via set_ticket_fee", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 50,
      ticketFeeMode: "per_person",
      ticketPriceBasis: "gross",
      ticketVatPercent: 0,
      guests: 2,
      pricingRules: rules([
        { when: "always", action: "set_ticket_fee", amount: 0, label: "Free entry" },
      ]),
    })
    expect(quote.ticketSubtotalHuf).toBe(0)
    expect(quote.totalHuf).toBe(0)
  })

  it("applies hotel package discount when hotel selected", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      ticketFeeMode: "per_person",
      ticketPriceBasis: "gross",
      ticketVatPercent: 0,
      guests: 2,
      accommodationGuests: 2,
      nights: 3,
      accommodation: hotelPricing,
      selections: { package_deal: "pkg3" },
      pricingRules: rules([
        {
          when: "with_hotel",
          action: "adjust_accommodation",
          amount: -100,
          amountMode: "per_person",
          label: "Hotel package discount",
        },
      ]),
    })
    // 2 packages × 500 = 1000, discount −200
    expect(quote.accommodationBaseHuf).toBe(1000)
    expect(quote.accommodationSubtotalHuf).toBe(800)
    expect(quote.totalHuf).toBe(800)
    expect(quote.lines.some((l) => l.label === "Hotel package discount" && l.amountHuf === -200)).toBe(
      true
    )
  })

  it("charges off-site surcharge when no organizer hotel", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      ticketFeeMode: "per_person",
      ticketPriceBasis: "gross",
      ticketVatPercent: 0,
      guests: 2,
      pricingRules: rules([
        {
          when: "without_hotel",
          action: "adjust_total",
          amount: 100,
          amountMode: "per_person",
          label: "External accommodation fee",
        },
      ]),
    })
    expect(quote.ticketSubtotalHuf).toBe(0)
    expect(quote.totalHuf).toBe(200)
    expect(
      quote.lines.some((l) => l.label === "External accommodation fee" && l.amountHuf === 200)
    ).toBe(true)
  })

  it("does not apply without_hotel surcharge when hotel is selected", () => {
    const quote = calculateBookingQuote({
      ticketFeeHuf: 0,
      ticketFeeMode: "per_person",
      ticketPriceBasis: "gross",
      ticketVatPercent: 0,
      guests: 1,
      accommodationGuests: 1,
      nights: 3,
      accommodation: hotelPricing,
      selections: { package_deal: "pkg3" },
      pricingRules: rules([
        {
          when: "without_hotel",
          action: "adjust_total",
          amount: 100,
          amountMode: "per_person",
          label: "External accommodation fee",
        },
        {
          when: "with_hotel",
          action: "adjust_accommodation",
          amount: -100,
          amountMode: "per_person",
          label: "Hotel package discount",
        },
      ]),
    })
    expect(quote.totalHuf).toBe(400) // 500 − 100
    expect(quote.lines.some((l) => l.label === "External accommodation fee")).toBe(false)
  })

  it("combines free entry + hotel discount + off-site surcharge correctly", () => {
    const withHotel = calculateBookingQuote({
      ticketFeeHuf: 40,
      ticketFeeMode: "per_person",
      ticketPriceBasis: "gross",
      ticketVatPercent: 0,
      guests: 1,
      accommodationGuests: 1,
      nights: 3,
      accommodation: hotelPricing,
      selections: { package_deal: "pkg3" },
      pricingRules: rules([
        { when: "always", action: "set_ticket_fee", amount: 0, label: "Free entry" },
        {
          when: "with_hotel",
          action: "adjust_accommodation",
          amount: -100,
          amountMode: "fixed",
          label: "Package discount",
        },
        {
          when: "without_hotel",
          action: "adjust_total",
          amount: 100,
          amountMode: "fixed",
          label: "Off-site fee",
        },
      ]),
    })
    expect(withHotel.ticketSubtotalHuf).toBe(0)
    expect(withHotel.totalHuf).toBe(400)

    const withoutHotel = calculateBookingQuote({
      ticketFeeHuf: 40,
      ticketFeeMode: "per_person",
      ticketPriceBasis: "gross",
      ticketVatPercent: 0,
      guests: 1,
      pricingRules: rules([
        { when: "always", action: "set_ticket_fee", amount: 0, label: "Free entry" },
        {
          when: "with_hotel",
          action: "adjust_accommodation",
          amount: -100,
          amountMode: "fixed",
          label: "Package discount",
        },
        {
          when: "without_hotel",
          action: "adjust_total",
          amount: 100,
          amountMode: "fixed",
          label: "Off-site fee",
        },
      ]),
    })
    expect(withoutHotel.ticketSubtotalHuf).toBe(0)
    expect(withoutHotel.totalHuf).toBe(100)
  })
})

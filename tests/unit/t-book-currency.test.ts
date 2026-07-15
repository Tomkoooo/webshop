import { describe, expect, it } from "vitest"
import {
  DEFAULT_TBOOK_CURRENCY,
  formatTBookMoney,
  normalizeTBookCurrency,
  stripeCurrencyCode,
  toStripeUnitAmount,
} from "@wse/plugin-t-book/lib/currency"

describe("tBook currency", () => {
  it("defaults unknown codes to HUF", () => {
    expect(normalizeTBookCurrency(undefined)).toBe(DEFAULT_TBOOK_CURRENCY)
    expect(normalizeTBookCurrency("xyz")).toBe(DEFAULT_TBOOK_CURRENCY)
    expect(normalizeTBookCurrency("eur")).toBe("EUR")
  })

  it("formats HUF without decimals", () => {
    expect(formatTBookMoney(12500, "HUF")).toContain("12")
    expect(formatTBookMoney(12500, "HUF")).toMatch(/Ft|HUF/)
  })

  it("formats EUR with currency symbol", () => {
    const formatted = formatTBookMoney(49.5, "EUR")
    expect(formatted).toMatch(/49/)
    expect(formatted).toMatch(/€|EUR/)
  })

  it("maps Stripe unit amounts per currency rules", () => {
    expect(toStripeUnitAmount(15000, "HUF")).toBe(15000)
    expect(toStripeUnitAmount(49.99, "EUR")).toBe(4999)
    expect(stripeCurrencyCode("EUR")).toBe("eur")
  })
})

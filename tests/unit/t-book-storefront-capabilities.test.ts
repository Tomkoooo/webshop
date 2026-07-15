import { describe, expect, it } from "vitest"
import {
  formatTBookCapabilitiesSummary,
  TBOOK_PUBLIC_API_VERSION,
} from "../../packages/plugins/t-book/lib/storefront-capabilities"

describe("t-book storefront capabilities", () => {
  it("formats a human-readable summary", () => {
    const summary = formatTBookCapabilitiesSummary({
      apiVersion: TBOOK_PUBLIC_API_VERSION,
      eventCount: 4,
      hotelCount: 2,
      packageHotels: 1,
      roomHotels: 1,
      packageDeals: 3,
      eventsWithRegistrationFields: 2,
      teamEvents: 1,
    })
    expect(summary).toContain("4 esemény")
    expect(summary).toContain("2 szállás")
    expect(summary).toContain("csomagos")
    expect(summary).toContain("szobás")
    expect(summary).toContain("regisztrációs")
    expect(summary).toContain(`API v${TBOOK_PUBLIC_API_VERSION}`)
  })
})

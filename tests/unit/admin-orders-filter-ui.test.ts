import { describe, expect, it } from "vitest"
import { countAdvancedOrderFilters, hasAdvancedOrderFilters } from "@wse/core/lib/admin-orders-filter-ui"

describe("admin-orders-filter-ui", () => {
  it("detects advanced filters", () => {
    expect(hasAdvancedOrderFilters({ q: "x" })).toBe(false)
    expect(hasAdvancedOrderFilters({ labelState: "needs" })).toBe(true)
    expect(countAdvancedOrderFilters({ labelState: "needs", unitsMin: "2" })).toBe(2)
  })
})

import { describe, expect, it } from "vitest"
import {
  hotelComplexityStats,
  normalizeHotelPricing,
} from "@wse/plugin-t-book/lib/hotel-pricing"

describe("hotel pricing hierarchy", () => {
  it("migrates legacy flat pricing to room types + addon groups", () => {
    const normalized = normalizeHotelPricing({
      priceBasis: "gross",
      vatPercent: 27,
      baseRateHuf: 12000,
      baseRateMode: "per_person_per_night",
      options: [
        {
          key: "meals",
          label: "Étkezés",
          type: "select",
          choices: [{ value: "breakfast", label: "Reggeli", priceHuf: 2000, priceMode: "fixed" }],
        },
      ],
    })
    expect(normalized.roomTypes).toHaveLength(1)
    expect(normalized.roomTypes[0]?.baseRateHuf).toBe(12000)
    expect(normalized.extrasSection).not.toBeNull()
    expect(normalized.extrasSection?.options[0]?.key).toBe("meals")
    expect(normalized.addonGroups).toHaveLength(0)
  })

  it("estimates booking path count for admin summary", () => {
    const stats = hotelComplexityStats({
      priceBasis: "net",
      vatPercent: 27,
      roomTypes: [
        { key: "a", label: "A", baseRateHuf: 10000 },
        { key: "b", label: "B", baseRateHuf: 12000 },
      ],
      extrasSection: {
        label: "Extrák",
        options: [
          {
            key: "meals",
            label: "Étkezés",
            type: "select",
            choices: [
              { value: "none", label: "Nincs", priceHuf: 0, priceMode: "fixed" },
              { value: "full", label: "Teljes", priceHuf: 5000, priceMode: "fixed" },
            ],
          },
        ],
      },
    })
    expect(stats.roomTypeCount).toBe(2)
    expect(stats.estimatedBookingPaths).toBe(4)
  })
})

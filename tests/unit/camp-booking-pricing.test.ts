import { describe, expect, it } from "vitest"
import {
  calculateCampOrderTotal,
  calculateCampTotalHuf,
  calculateLaptopAddonHuf,
  hasSiblingPair,
  filterStorefrontBaseTickets,
  isLaptopTicketTypeName,
  resolveEffectiveUnitPriceHuf,
  resolveFamilyDiscountPercent,
  seatsRequiredForBooking,
} from "@wse/plugin-camp-booking/lib/pricing"
import { buildCampRegistrationExportRows } from "@wse/plugin-camp-booking/lib/camp-registration-export"

describe("camp-booking pricing", () => {
  it("per_child multiplies by child count", () => {
    expect(calculateCampTotalHuf(89000, "per_child", 2)).toBe(178000)
  })

  it("flat ignores child count beyond minimum seat", () => {
    expect(calculateCampTotalHuf(25000, "flat", 3)).toBe(25000)
  })

  it("seats required equals child count", () => {
    expect(seatsRequiredForBooking(3)).toBe(3)
  })

  it("detects laptop add-on ticket names", () => {
    expect(isLaptopTicketTypeName("Laptopbérlés")).toBe(true)
    expect(isLaptopTicketTypeName("TáborJegy")).toBe(false)
  })

  it("hides normál base tickets while early bird base ticket is active", () => {
    const tickets = [
      { name: "1. turnus — early bird jegy", isActive: true },
      { name: "1. turnus — normál jegy", isActive: true },
      { name: "1. turnus — testvér jegy", isActive: true },
    ]
    const filtered = filterStorefrontBaseTickets(tickets)
    expect(filtered.map((t) => t.name)).toEqual([
      "1. turnus — early bird jegy",
      "1. turnus — testvér jegy",
    ])
  })

  it("shows normál when no early bird ticket on session", () => {
    const tickets = [
      { name: "1. turnus — normál jegy", isActive: true },
      { name: "1. turnus — testvér jegy", isActive: true },
    ]
    expect(filterStorefrontBaseTickets(tickets)).toHaveLength(2)
  })

  it("shows normál after early bird end date passes", () => {
    const at = new Date("2026-06-10")
    const tickets = [
      {
        name: "1. turnus — early bird jegy",
        isActive: true,
        earlyBirdEndsAt: new Date("2026-06-07T23:59:00"),
      },
      { name: "1. turnus — normál jegy", isActive: true },
      { name: "1. turnus — testvér jegy", isActive: true },
    ]
    const filtered = filterStorefrontBaseTickets(tickets, at)
    expect(filtered.map((t) => t.name)).toEqual([
      "1. turnus — normál jegy",
      "1. turnus — testvér jegy",
    ])
  })

  it("calculates laptop addon total", () => {
    expect(calculateLaptopAddonHuf(2, 10000)).toBe(20000)
  })

  it("applies early bird fixed price before deadline", () => {
    const at = new Date("2026-05-01")
    const result = resolveEffectiveUnitPriceHuf(
      {
        name: "Táborjegy",
        priceHuf: 75000,
        pricingMode: "per_child",
        earlyBirdEndsAt: new Date("2026-06-30"),
        earlyBirdPriceHuf: 67500,
      },
      at
    )
    expect(result.unitPriceHuf).toBe(67500)
    expect(result.earlyBirdActive).toBe(true)
  })

  it("applies early bird percent when no fixed price", () => {
    const result = resolveEffectiveUnitPriceHuf({
      name: "Táborjegy",
      priceHuf: 100000,
      pricingMode: "per_child",
      earlyBirdEndsAt: new Date("2099-01-01"),
      earlyBirdDiscountPercent: 10,
    })
    expect(result.unitPriceHuf).toBe(90000)
  })

  it("detects siblings by last name token", () => {
    expect(
      hasSiblingPair([
        { name: "Kovács Bence" },
        { name: "Kovács Lili" },
      ])
    ).toBe(true)
    expect(hasSiblingPair([{ name: "Bence", lastName: "Nagy" }, { name: "Lili", lastName: "Nagy" }])).toBe(
      true
    )
    expect(hasSiblingPair([{ name: "Bence" }, { name: "Lili" }])).toBe(false)
  })

  it("uses higher of multi-child and sibling discount", () => {
    const pct = resolveFamilyDiscountPercent(
      {
        multiChildDiscountPercent: 5,
        multiChildMinCount: 2,
        siblingDiscountPercent: 10,
        siblingMatchByLastName: true,
      },
      2,
      [{ name: "Kovács A" }, { name: "Kovács B" }]
    )
    expect(pct).toBe(10)
  })

  it("calculates full order with family discount and addons", () => {
    const order = calculateCampOrderTotal({
      ticket: {
        name: "Táborjegy",
        priceHuf: 100000,
        pricingMode: "per_child",
      },
      childCount: 2,
      children: [{ name: "Nagy Anna" }, { name: "Nagy Béla" }],
      campSettings: {
        multiChildDiscountPercent: 0,
        multiChildMinCount: 2,
        siblingDiscountPercent: 10,
        siblingMatchByLastName: true,
      },
      addons: [
        {
          ticket: { name: "Laptop", priceHuf: 10000, pricingMode: "per_child", kind: "addon" },
          quantity: 1,
        },
      ],
    })
    expect(order.campSubtotalHuf).toBe(200000)
    expect(order.familyDiscountHuf).toBe(20000)
    expect(order.addonsHuf).toBe(10000)
    expect(order.totalHuf).toBe(190000)
  })
})

describe("camp registration export", () => {
  it("emits one row per child with buyer columns", () => {
    const rows = buildCampRegistrationExportRows([
      {
        buyerName: "Kovács Anna",
        buyerEmail: "anna@example.com",
        buyerPhone: "+36123456789",
        sessionLabel: "I. turnus",
        ticketTypeName: "Teljes turnus",
        totalHuf: 178000,
        childCount: 2,
        paidAt: new Date("2026-05-01"),
        children: [
          {
            name: "Bence",
            birthDate: "2015-03-01",
            diningOption: "Normál",
            dietaryRequest: "",
            allergies: "mogyoró",
            laptopRental: true,
          },
          {
            name: "Lili",
            birthDate: "2017-08-12",
            diningOption: "Vegetáriánus",
            dietaryRequest: "",
            allergies: "",
            laptopRental: false,
          },
        ],
      } as never,
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0]["Vásárló neve"]).toBe("Kovács Anna")
    expect(rows[0]["Gyerek neve"]).toBe("Bence")
    expect(rows[1]["Gyerek neve"]).toBe("Lili")
    expect(rows[0].Turnus).toBe("I. turnus")
    expect(rows[0]["Laptop bérlés"]).toBe("Igen")
    expect(rows[1]["Laptop bérlés"]).toBe("Nem")
    expect(rows[1].Étkezés).toBe("Vegetáriánus")
  })
})

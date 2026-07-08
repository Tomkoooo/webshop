import { describe, expect, it } from "vitest"
import {
  applyWorkspaceFilters,
  summarizeOrder,
  type AdminOrderSummary,
} from "@wse/core/lib/admin-orders-workspace"

function baseOrder(overrides: Partial<AdminOrderSummary> = {}): AdminOrderSummary {
  return {
    id: "order-1",
    orderNumber: "WS-0001",
    createdAt: new Date().toISOString(),
    status: "processing",
    customerName: "Teszt Vásárló",
    deliveryHint: "Budapest",
    items: [{ name: "Termék A", quantity: 1, price: 1000 }],
    itemKinds: 1,
    totalUnits: 1,
    gross: 1000,
    net: 800,
    vat: 200,
    discount: 0,
    shippingType: "standard",
    shippingLabel: "Standard",
    hasLabel: false,
    needsLabel: true,
    isGeneratingLabel: false,
    mixSignature: "a=1",
    mixKey: "abc",
    ...overrides,
  }
}

describe("applyWorkspaceFilters label states", () => {
  it("filters generating labels", () => {
    const orders = [
      baseOrder({ id: "1", isGeneratingLabel: true, needsLabel: true }),
      baseOrder({ id: "2", isGeneratingLabel: false, needsLabel: true }),
    ]
    const result = applyWorkspaceFilters(orders, { labelState: "generating" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("excludes generating orders from needs filter", () => {
    const orders = [
      baseOrder({ id: "1", isGeneratingLabel: true, needsLabel: true }),
      baseOrder({ id: "2", isGeneratingLabel: false, needsLabel: true }),
    ]
    const result = applyWorkspaceFilters(orders, { labelState: "needs" })
    expect(result.map((order) => order.id)).toEqual(["2"])
  })

  it("filters label generation errors", () => {
    const orders = [
      baseOrder({ id: "1", labelError: "GLS API hiba" }),
      baseOrder({ id: "2", labelError: undefined }),
    ]
    const result = applyWorkspaceFilters(orders, { labelState: "error" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("1")
  })

  it("keeps mix filter when narrowing within the same mix", () => {
    const orders = [
      baseOrder({ id: "1", mixKey: "mix-a", status: "processing" }),
      baseOrder({ id: "2", mixKey: "mix-a", status: "shipped" }),
      baseOrder({ id: "3", mixKey: "mix-b", status: "processing" }),
    ]
    const result = applyWorkspaceFilters(orders, { mix: "mix-a" })
    expect(result).toHaveLength(2)
    expect(result.every((order) => order.mixKey === "mix-a")).toBe(true)
  })
})

describe("summarizeOrder standard shipping labels", () => {
  it("marks standard orders as needing label when PDF missing", () => {
    const summary = summarizeOrder({
      _id: "507f1f77bcf86cd799439011",
      items: [{ name: "X", quantity: 1, price: 100 }],
      billingInfo: { name: "A" },
      shippingAddress: { city: "Bp" },
      subtotal: 100,
      shippingFee: 0,
      paymentFee: 0,
      total: 100,
    })
    expect(summary.shippingType).toBe("standard")
    expect(summary.needsLabel).toBe(true)
    expect(summary.hasLabel).toBe(false)
  })

  it("detects generating standard label", () => {
    const summary = summarizeOrder({
      _id: "507f1f77bcf86cd799439011",
      items: [{ name: "X", quantity: 1, price: 100 }],
      billingInfo: { name: "A" },
      shippingAddress: { city: "Bp" },
      standardShippingLabel: { status: "generating" },
      subtotal: 100,
      shippingFee: 0,
      paymentFee: 0,
      total: 100,
    })
    expect(summary.isGeneratingLabel).toBe(true)
  })

  it("captures standard label generation errors", () => {
    const summary = summarizeOrder({
      _id: "507f1f77bcf86cd799439011",
      items: [{ name: "X", quantity: 1, price: 100 }],
      billingInfo: { name: "A" },
      shippingAddress: { city: "Bp" },
      standardShippingLabel: { lastError: "A címke generálása sikertelen." },
      subtotal: 100,
      shippingFee: 0,
      paymentFee: 0,
      total: 100,
    })
    expect(summary.labelError).toBe("A címke generálása sikertelen.")
  })
})

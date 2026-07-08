import { describe, expect, it } from "vitest"
import mongoose from "mongoose"
import {
  buildAdminOrdersMongoQuery,
  filterAdminOrders,
} from "@wse/core/lib/admin-orders-query"

describe("buildAdminOrdersMongoQuery", () => {
  it("adds product filter when productId is set", () => {
    const productId = new mongoose.Types.ObjectId().toString()
    const query = buildAdminOrdersMongoQuery({ productId })
    expect(query["items.product"]).toBeInstanceOf(mongoose.Types.ObjectId)
    expect(String(query["items.product"])).toBe(productId)
  })

  it("ignores invalid product ids", () => {
    const query = buildAdminOrdersMongoQuery({ productId: "not-an-id" })
    expect(query["items.product"]).toBeUndefined()
  })
})

describe("filterAdminOrders", () => {
  const orders = [
    {
      _id: "abc123def456",
      billingInfo: { name: "Kovács Anna", email: "anna@test.hu" },
      shippingAddress: { city: "Budapest" },
      items: [{ name: "Póló" }],
      glsParcelPoint: { id: "g1" },
    },
    {
      _id: "xyz789",
      billingInfo: { name: "Nagy Béla" },
      shippingAddress: { city: "Debrecen" },
      items: [{ name: "Sapka" }],
    },
  ]

  it("filters by shipping type", () => {
    const glsOnly = filterAdminOrders(orders, { shippingType: "gls" })
    expect(glsOnly).toHaveLength(1)
    expect(glsOnly[0].billingInfo.name).toBe("Kovács Anna")
  })

  it("filters by search query", () => {
    const result = filterAdminOrders(orders, { q: "debrecen" })
    expect(result).toHaveLength(1)
    expect(result[0].billingInfo.name).toBe("Nagy Béla")
  })
})

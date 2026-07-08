import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const authMock = vi.fn()
const dbConnectMock = vi.fn()
const orderFindMock = vi.fn()
const buildExcelMock = vi.fn()

vi.mock("@wse/core/auth", () => ({ auth: authMock }))
vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }))
vi.mock("@wse/core/models/User", () => ({}))
vi.mock("@wse/core/models/ShippingMethod", () => ({}))
vi.mock("@wse/core/models/PaymentMethod", () => ({}))
vi.mock("@wse/core/models/Order", () => ({
  default: { find: orderFindMock },
}))
vi.mock("@wse/core/lib/admin-orders-export", () => ({
  buildAdminOrdersExcelBuffer: (...args: unknown[]) => buildExcelMock(...args),
}))

describe("admin orders excel export route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { role: "ADMIN" } })
    dbConnectMock.mockResolvedValue(undefined)
    buildExcelMock.mockResolvedValue(Buffer.from("xlsx"))
  })

  it("exports only selected order ids when ids param is present", async () => {
    orderFindMock.mockReturnValue({
      populate: vi.fn().mockReturnThis(),
      sort: vi.fn().mockReturnThis(),
      lean: vi.fn().mockResolvedValue([
        {
          _id: "507f1f77bcf86cd799439011",
          billingInfo: { email: "a@test.hu" },
          items: [],
        },
      ]),
    })

    const { GET } = await import("@wse/admin/app/api/admin/orders/export/route")
    const req = new NextRequest(
      "http://localhost/api/admin/orders/export?ids=507f1f77bcf86cd799439011"
    )
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(orderFindMock).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: { $in: ["507f1f77bcf86cd799439011"] },
      })
    )
    expect(buildExcelMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ _id: "507f1f77bcf86cd799439011" }),
      ]),
      expect.any(Object)
    )
  })
})

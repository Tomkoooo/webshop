import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"

const authMock = vi.fn()
const dbConnectMock = vi.fn()
const orderFindMock = vi.fn()

vi.mock("@wse/core/auth", () => ({ auth: authMock }))
vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }))
vi.mock("@wse/core/models/Order", () => ({
  default: { find: orderFindMock },
}))

describe("admin orders export-labels route", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.mockResolvedValue({ user: { role: "ADMIN" } })
    dbConnectMock.mockResolvedValue(undefined)
  })

  it("returns 401 for non-admin users", async () => {
    authMock.mockResolvedValueOnce({ user: { role: "USER" } })
    const { GET } = await import("@wse/admin/app/api/admin/orders/export-labels/route")
    const req = new NextRequest("http://localhost/api/admin/orders/export-labels")
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it("returns 404 when filtered orders have no label payloads", async () => {
    orderFindMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: "507f1f77bcf86cd799439011",
              glsLabel: {},
              foxpostShipment: {},
            },
          ]),
        }),
      }),
    })

    const { GET } = await import("@wse/admin/app/api/admin/orders/export-labels/route")
    const req = new NextRequest("http://localhost/api/admin/orders/export-labels")
    const res = await GET(req)
    expect(res.status).toBe(404)
  })

  it("returns zip when label payloads exist for selected ids", async () => {
    orderFindMock.mockReturnValue({
      select: vi.fn().mockReturnValue({
        sort: vi.fn().mockReturnValue({
          lean: vi.fn().mockResolvedValue([
            {
              _id: "507f1f77bcf86cd799439011",
              glsLabel: { labelDataBase64: Buffer.from("pdf").toString("base64") },
              foxpostShipment: {},
            },
          ]),
        }),
      }),
    })

    const { GET } = await import("@wse/admin/app/api/admin/orders/export-labels/route")
    const req = new NextRequest(
      "http://localhost/api/admin/orders/export-labels?ids=507f1f77bcf86cd799439011"
    )
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(res.headers.get("Content-Type")).toBe("application/zip")
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes.subarray(0, 2)).toEqual(new Uint8Array([0x50, 0x4b]))
  })
})

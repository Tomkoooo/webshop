import { describe, expect, it } from "vitest"
import {
  buildAdminLabelAbsoluteUrl,
  buildAdminOrdersExportRows,
} from "@wse/core/lib/admin-orders-export"
import { buildAdminOrderLabelsZipBuffer } from "@wse/core/lib/admin-orders-labels-zip"

describe("admin orders export label columns", () => {
  it("includes absolute label links and generated timestamps", () => {
    const previousAppUrl = process.env.NEXT_PUBLIC_APP_URL
    process.env.NEXT_PUBLIC_APP_URL = "https://shop.example"

    const rows = buildAdminOrdersExportRows([
      {
        _id: "507f1f77bcf86cd799439011",
        glsLabel: {
          labelUrl: "/api/admin/orders/507f1f77bcf86cd799439011/gls-label",
          generatedAt: "2026-06-01T10:00:00.000Z",
          parcelNumber: "GLS123",
        },
        foxpostShipment: {
          labelUrl: "/api/admin/orders/507f1f77bcf86cd799439011/foxpost-label",
          generatedAt: "2026-06-01T11:00:00.000Z",
          clFoxId: "CLFOX1",
        },
      },
    ])

    expect(rows[0]["GLS címke link"]).toBe(
      "https://shop.example/api/admin/orders/507f1f77bcf86cd799439011/gls-label"
    )
    expect(rows[0]["Foxpost címke link"]).toBe(
      "https://shop.example/api/admin/orders/507f1f77bcf86cd799439011/foxpost-label"
    )
    expect(rows[0]["GLS címke generálva"]).toContain("2026-06-01")
    expect(rows[0]["Foxpost címke generálva"]).toContain("2026-06-01")

    process.env.NEXT_PUBLIC_APP_URL = previousAppUrl
  })

  it("builds absolute label urls with localhost fallback", () => {
    expect(buildAdminLabelAbsoluteUrl("/api/admin/orders/1/gls-label")).toBe(
      "http://localhost:3000/api/admin/orders/1/gls-label"
    )
  })
})

describe("admin order labels zip", () => {
  it("returns null when no label payloads exist", async () => {
    const buffer = await buildAdminOrderLabelsZipBuffer([
      { _id: "507f1f77bcf86cd799439011", glsLabel: {}, foxpostShipment: {} },
    ])
    expect(buffer).toBeNull()
  })

  it("packs gls and foxpost pdfs into a zip buffer", async () => {
    const buffer = await buildAdminOrderLabelsZipBuffer([
      {
        _id: "507f1f77bcf86cd799439011",
        glsLabel: { labelDataBase64: Buffer.from("gls-pdf").toString("base64") },
        foxpostShipment: { labelDataBase64: Buffer.from("fox-pdf").toString("base64") },
      },
    ])

    expect(buffer).not.toBeNull()
    expect(buffer!.length).toBeGreaterThan(20)
    expect(buffer!.subarray(0, 2).toString()).toBe("PK")
  })
})

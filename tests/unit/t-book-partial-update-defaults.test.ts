import { describe, expect, it } from "vitest"
import {
  eventGroupInputSchema,
  eventGroupUpdateSchema,
  eventInputSchema,
  eventUpdateSchema,
  hotelInputBaseSchema,
  hotelInputUpdateSchema,
} from "@wse/plugin-t-book/lib/schemas"

describe("t-book partial update schemas do not apply create defaults", () => {
  it("group update with only voucherHeaderImage does not inject status draft", () => {
    const buggyPartial = eventGroupInputSchema.partial().parse({
      voucherHeaderImage: "https://cdn.example.com/header.png",
    })
    expect(buggyPartial.status).toBe("draft")

    const fixed = eventGroupUpdateSchema.parse({
      voucherHeaderImage: "https://cdn.example.com/header.png",
    })
    expect(fixed).toEqual({
      voucherHeaderImage: "https://cdn.example.com/header.png",
    })
    expect("status" in fixed).toBe(false)
  })

  it("group update with only status does not wipe voucherHeaderImage", () => {
    const buggyPartial = eventGroupInputSchema.partial().parse({ status: "active" })
    expect(buggyPartial.voucherHeaderImage).toBe("")

    const fixed = eventGroupUpdateSchema.parse({ status: "active" })
    expect(fixed).toEqual({ status: "active" })
    expect("voucherHeaderImage" in fixed).toBe(false)
  })

  it("event update does not inject defaults for omitted fields", () => {
    const buggy = eventInputSchema.partial().parse({ name: "Updated" })
    expect(buggy.status).toBe("draft")
    expect(buggy.eligibilityPreset).toBe("none")

    const fixed = eventUpdateSchema.parse({ name: "Updated" })
    expect(fixed).toEqual({ name: "Updated" })
  })

  it("hotel update does not inject status draft when only name changes", () => {
    const buggy = hotelInputBaseSchema.partial().parse({ name: "Hotel X" })
    expect(buggy.status).toBe("draft")

    const fixed = hotelInputUpdateSchema.parse({ name: "Hotel X" })
    expect(fixed).toEqual({ name: "Hotel X" })
  })
})

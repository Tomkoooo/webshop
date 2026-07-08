import { describe, expect, it } from "vitest"
import { normalizeAdminVariants } from "@wse/core/lib/admin-product-variants"

describe("normalizeAdminVariants", () => {
  it("drops mongoose subdocument _id and other non-plain fields", () => {
    const rows = normalizeAdminVariants(
      [
        {
          id: "num-334",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          _id: { buffer: Uint8Array.from([1, 2, 3]) } as any,
          slugPart: "num-334",
          netPrice: 5000,
          stock: 1,
        },
      ],
      1000
    )
    expect(rows[0].id).toBe("num-334")
    expect(rows[0]).not.toHaveProperty("_id")
    expect(rows[0]).not.toHaveProperty("slugPart")
  })
})

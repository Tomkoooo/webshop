import { describe, expect, it } from "vitest"
import { resolveVoucherHeaderImage } from "@wse/plugin-t-book/lib/voucher-header"

describe("resolveVoucherHeaderImage", () => {
  it("prefers event-specific header over group default", () => {
    expect(
      resolveVoucherHeaderImage(
        { voucherHeaderImage: "/event-header.jpg", heroImage: "/hero.jpg" },
        { voucherHeaderImage: "/group-header.jpg" }
      )
    ).toBe("/event-header.jpg")
  })

  it("falls back to group header when event header is empty", () => {
    expect(
      resolveVoucherHeaderImage(
        { voucherHeaderImage: "", heroImage: "/hero.jpg" },
        { voucherHeaderImage: "/group-header.jpg" }
      )
    ).toBe("/group-header.jpg")
  })

  it("falls back to hero image when neither event nor group header is set", () => {
    expect(
      resolveVoucherHeaderImage(
        { voucherHeaderImage: "", heroImage: "/hero.jpg" },
        { voucherHeaderImage: "" }
      )
    ).toBe("/hero.jpg")
  })

  it("falls back to group default hero when no voucher or event hero is set", () => {
    expect(
      resolveVoucherHeaderImage(
        { voucherHeaderImage: "", heroImage: "" },
        { voucherHeaderImage: "", defaultHeroImage: "/group-hero.jpg" }
      )
    ).toBe("/group-hero.jpg")
  })
})

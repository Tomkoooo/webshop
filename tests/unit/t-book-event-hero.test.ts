import { describe, expect, it } from "vitest"
import { resolveEventHeroImage } from "@wse/plugin-t-book/lib/event-hero"

describe("resolveEventHeroImage", () => {
  it("prefers event hero over group default", () => {
    expect(
      resolveEventHeroImage(
        { heroImage: "/event.jpg" },
        { defaultHeroImage: "/group.jpg" }
      )
    ).toBe("/event.jpg")
  })

  it("falls back to group default when event hero is empty", () => {
    expect(
      resolveEventHeroImage({ heroImage: "" }, { defaultHeroImage: "/group.jpg" })
    ).toBe("/group.jpg")
  })
})

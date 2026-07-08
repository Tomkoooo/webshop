import { describe, expect, it } from "vitest"
import { parseCmsThemeHints } from "@wse/core/lib/cms-theme-hints"

describe("parseCmsThemeHints", () => {
  it("maps text and background theme utilities", () => {
    const hints = parseCmsThemeHints(
      "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
    )
    expect(hints).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ themeToken: "background", role: "background", state: "default" }),
        expect.objectContaining({ themeToken: "foreground", role: "text", state: "default" }),
        expect.objectContaining({ themeToken: "accent", role: "background", state: "hover" }),
        expect.objectContaining({ themeToken: "accentForeground", role: "text", state: "hover" }),
      ])
    )
  })

  it("ignores non-theme utility classes", () => {
    expect(parseCmsThemeHints("px-4 py-2 rounded-full")).toEqual([])
  })
})

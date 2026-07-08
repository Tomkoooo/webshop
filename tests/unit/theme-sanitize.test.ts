import { describe, expect, it } from "vitest"
import { getThemeContrastWarnings, sanitizeThemeTokens } from "@wse/core/lib/theme-sanitize"
import type { ThemeTokens } from "@wse/core/services/theme"
import { minecraftCampTheme } from "@wse/template-minecraft-camp/theme"

describe("theme-sanitize", () => {
  it("sanitize still clamps white foreground on light background when used explicitly", () => {
    const result = sanitizeThemeTokens(
      { ...minecraftCampTheme, foreground: "#FFFFFF" },
      minecraftCampTheme
    )
    expect(result.foreground).toBe(minecraftCampTheme.foreground)
  })

  it("warns when foreground and background are too close", () => {
    const warnings = getThemeContrastWarnings({
      ...minecraftCampTheme,
      foreground: "#FFFFFF",
    })
    expect(warnings.some((w) => w.includes("foreground"))).toBe(true)
  })
})

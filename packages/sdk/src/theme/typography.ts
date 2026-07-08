/**
 * CMS-editable typography tokens (v2). Applied as CSS variables next to the
 * color tokens so operators can tune fonts and heading scale without code.
 */

export type ThemeTypography = {
  /** CSS font-family stack for headings, e.g. `"Oswald", sans-serif`. */
  fontHeading: string
  /** CSS font-family stack for body copy. */
  fontBody: string
  /** Heading font weight (CSS value, e.g. "700"). */
  weightHeading: string
  /** rem size of the hero headline, e.g. "3.5rem". */
  sizeHero: string
  /** rem size of section headings (h2), e.g. "2rem". */
  sizeHeading: string
  /** rem size of body text, e.g. "1rem". */
  sizeBody: string
}

export const THEME_TYPOGRAPHY_KEYS = [
  "fontHeading",
  "fontBody",
  "weightHeading",
  "sizeHero",
  "sizeHeading",
  "sizeBody",
] as const

export type ThemeTypographyKey = (typeof THEME_TYPOGRAPHY_KEYS)[number]

export const DEFAULT_THEME_TYPOGRAPHY: ThemeTypography = {
  fontHeading: `"Oswald", "Roboto Condensed", sans-serif`,
  fontBody: `"Inter", "Roboto", ui-sans-serif, system-ui`,
  weightHeading: "700",
  sizeHero: "3.5rem",
  sizeHeading: "2rem",
  sizeBody: "1rem",
}

/** `--theme-*` CSS variables consumed by globals.css `@theme` bridges. */
export function themeTypographyToCssVars(
  typography: Partial<ThemeTypography> | null | undefined
): Record<string, string> {
  const merged = { ...DEFAULT_THEME_TYPOGRAPHY, ...(typography ?? {}) }
  return {
    "--theme-font-heading": merged.fontHeading,
    "--theme-font-body": merged.fontBody,
    "--theme-weight-heading": merged.weightHeading,
    "--theme-size-hero": merged.sizeHero,
    "--theme-size-heading": merged.sizeHeading,
    "--theme-size-body": merged.sizeBody,
  }
}

export function normalizeThemeTypography(raw: unknown): Partial<ThemeTypography> {
  if (!raw || typeof raw !== "object") return {}
  const out: Partial<ThemeTypography> = {}
  for (const key of THEME_TYPOGRAPHY_KEYS) {
    const value = (raw as Record<string, unknown>)[key]
    if (typeof value === "string" && value.trim()) out[key] = value.trim()
  }
  return out
}

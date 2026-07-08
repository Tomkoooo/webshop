import type { ThemeTokens } from "@wse/core/services/theme"

function parseHex(hex: string): [number, number, number] | null {
  const normalized = hex.trim()
  const match = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.exec(normalized)
  if (!match) return null
  let raw = match[1]
  if (raw.length === 3) {
    raw = raw
      .split("")
      .map((c) => c + c)
      .join("")
  }
  const n = parseInt(raw, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrastRatio(a: string, b: string): number | null {
  const rgbA = parseHex(a)
  const rgbB = parseHex(b)
  if (!rgbA || !rgbB) return null
  const l1 = relativeLuminance(rgbA)
  const l2 = relativeLuminance(rgbB)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** True when two colors are too similar to read or see UI chrome (e.g. spinner). */
function colorsTooClose(foreground: string, background: string, minRatio = 1.8): boolean {
  const ratio = contrastRatio(foreground, background)
  if (ratio == null) return false
  return ratio < minRatio
}

/**
 * Optional clamp for low-contrast pairs (e.g. admin-only previews).
 * Storefront merged themes are **not** sanitized on read — saved overrides apply as-is.
 */
export function sanitizeThemeTokens(theme: ThemeTokens, fallback: ThemeTokens): ThemeTokens {
  const out = { ...theme }

  if (colorsTooClose(out.foreground, out.background)) {
    out.foreground = fallback.foreground
  }
  if (colorsTooClose(out.primaryForeground, out.background)) {
    out.primaryForeground = fallback.primaryForeground
  }
  if (colorsTooClose(out.mutedForeground, out.background)) {
    out.mutedForeground = fallback.mutedForeground
  }
  if (colorsTooClose(out.surfaceForeground, out.surface)) {
    out.surfaceForeground = fallback.surfaceForeground
  }

  return out
}

/** Human-readable hints after save when token pairs may be hard to read on the storefront. */
export function getThemeContrastWarnings(theme: ThemeTokens): string[] {
  const warnings: string[] = []
  if (colorsTooClose(theme.foreground, theme.background)) {
    warnings.push(
      "foreground and background are very similar — body text may be hard to read unless you use custom section colors."
    )
  }
  if (colorsTooClose(theme.primaryForeground, theme.background)) {
    warnings.push("primaryForeground may be hard to see on the page background.")
  }
  if (colorsTooClose(theme.surfaceForeground, theme.surface)) {
    warnings.push("surfaceForeground may be hard to read on surface panels.")
  }
  return warnings
}

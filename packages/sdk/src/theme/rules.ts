import type { ThemeTokenKey } from "./theme-token-keys"
import type { ThemeTokens } from "./tokens"

/**
 * Ruled theme tokens (v2).
 *
 * Tokens are semantic roles, not free colors: every text token has a defined
 * background it must stay readable on. These rules are shared by the admin
 * theme editor (live warnings) and `wse validate-template` (CI gate).
 */

export type ThemeRoleGroup = {
  id: "surfaces" | "text" | "actions" | "status"
  label: string
  tokens: ThemeTokenKey[]
}

/** Editor grouping: tokens by role instead of a flat alphabetical list. */
export const THEME_ROLE_GROUPS: ThemeRoleGroup[] = [
  {
    id: "surfaces",
    label: "Surfaces",
    tokens: ["background", "surface", "border", "muted"],
  },
  {
    id: "text",
    label: "Text",
    tokens: ["foreground", "surfaceForeground", "mutedForeground"],
  },
  {
    id: "actions",
    label: "Actions",
    tokens: [
      "primary",
      "primaryForeground",
      "secondary",
      "secondaryForeground",
      "accent",
      "accentForeground",
    ],
  },
  {
    id: "status",
    label: "Status",
    tokens: [
      "success",
      "successForeground",
      "warning",
      "warningForeground",
      "error",
      "errorForeground",
    ],
  },
]

export function parseHexColor(hex: string): [number, number, number] | null {
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

/** WCAG contrast ratio between two hex colors; null when either is not parseable. */
export function contrastRatio(a: string, b: string): number | null {
  const rgbA = parseHexColor(a)
  const rgbB = parseHexColor(b)
  if (!rgbA || !rgbB) return null
  const l1 = relativeLuminance(rgbA)
  const l2 = relativeLuminance(rgbB)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

export type ThemeContrastRule = {
  /** Token rendered as text. */
  text: ThemeTokenKey
  /** Token rendered as the background behind it. */
  background: ThemeTokenKey
  /** Minimum WCAG contrast ratio (4.5 = AA body text, 3 = AA large text / UI). */
  minRatio: number
  severity: "error" | "warning"
}

/** Canonical readable-pair matrix. Every text role names the surface it sits on. */
export const THEME_CONTRAST_RULES: ThemeContrastRule[] = [
  { text: "foreground", background: "background", minRatio: 4.5, severity: "error" },
  { text: "surfaceForeground", background: "surface", minRatio: 4.5, severity: "error" },
  { text: "primaryForeground", background: "primary", minRatio: 4.5, severity: "error" },
  { text: "secondaryForeground", background: "secondary", minRatio: 4.5, severity: "error" },
  { text: "accentForeground", background: "accent", minRatio: 4.5, severity: "error" },
  { text: "successForeground", background: "success", minRatio: 3, severity: "warning" },
  { text: "warningForeground", background: "warning", minRatio: 3, severity: "warning" },
  { text: "errorForeground", background: "error", minRatio: 3, severity: "warning" },
  { text: "mutedForeground", background: "background", minRatio: 3, severity: "warning" },
  { text: "mutedForeground", background: "surface", minRatio: 3, severity: "warning" },
]

export type ThemeContrastIssue = {
  rule: ThemeContrastRule
  ratio: number
  message: string
}

/** Evaluates the contrast matrix against a palette. Empty array = theme passes. */
export function validateThemeContrast(theme: ThemeTokens): ThemeContrastIssue[] {
  const issues: ThemeContrastIssue[] = []
  for (const rule of THEME_CONTRAST_RULES) {
    const ratio = contrastRatio(theme[rule.text], theme[rule.background])
    if (ratio == null) continue
    if (ratio < rule.minRatio) {
      issues.push({
        rule,
        ratio: Math.round(ratio * 100) / 100,
        message: `${rule.text} on ${rule.background} has contrast ${ratio.toFixed(2)} (needs ≥ ${rule.minRatio}).`,
      })
    }
  }
  return issues
}

/**
 * Token pairings templates must not emit on one element.
 * `wse validate-template` checks these against className literals.
 */
export const FORBIDDEN_CLASS_PAIRINGS = [
  {
    id: "same-token-bg-text",
    message: "The same theme token is used for both background and text on one element.",
  },
  {
    id: "primary-bg-wrong-text",
    message: "bg-primary must pair with text-primary-foreground (never text-primary or text-foreground).",
  },
] as const

const STATE_PREFIX_RE = /^(hover|focus|focus-visible|active|group-hover|disabled|aria-[a-z-]+|data-\[[^\]]*\]|md|lg|xl|sm|2xl):/

function stripStatePrefixes(cls: string): string {
  let out = cls
  while (STATE_PREFIX_RE.test(out)) out = out.replace(STATE_PREFIX_RE, "")
  return out
}

const TOKEN_UTILITY_RE = /^(bg|text)-([a-z-]+?)(?:\/\d+)?$/

const THEME_UTILITY_TOKENS = new Set([
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "background",
  "foreground",
  "surface",
  "surface-foreground",
  "border",
  "muted",
  "muted-foreground",
  "success",
  "success-foreground",
  "warning",
  "warning-foreground",
  "error",
  "error-foreground",
])

export type ClassPairingViolation = {
  pairing: (typeof FORBIDDEN_CLASS_PAIRINGS)[number]["id"]
  className: string
  message: string
}

/**
 * Checks one className string (a single element's classes) for forbidden
 * theme-token pairings.
 */
export function findClassPairingViolations(className: string): ClassPairingViolation[] {
  const violations: ClassPairingViolation[] = []
  let bgToken: string | null = null
  let textToken: string | null = null

  for (const raw of className.split(/\s+/)) {
    if (!raw) continue
    const cls = stripStatePrefixes(raw)
    const match = TOKEN_UTILITY_RE.exec(cls)
    if (!match) continue
    const [, kind, token] = match
    if (!THEME_UTILITY_TOKENS.has(token)) continue
    if (kind === "bg" && !bgToken) bgToken = token
    if (kind === "text" && !textToken) textToken = token
  }

  if (bgToken && textToken && bgToken === textToken) {
    violations.push({
      pairing: "same-token-bg-text",
      className,
      message: `bg-${bgToken} and text-${textToken} on one element make content invisible when the theme changes.`,
    })
  }
  if (bgToken === "primary" && textToken && textToken !== "primary-foreground") {
    violations.push({
      pairing: "primary-bg-wrong-text",
      className,
      message: `bg-primary pairs with text-primary-foreground, found text-${textToken}.`,
    })
  }
  return violations
}

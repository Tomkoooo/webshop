import { findClassPairingViolations } from "@wse/sdk/theme/rules"

/**
 * Declarative token props for Cms* primitives. Restricting styling to named
 * roles keeps agent-written templates inside the ruled theme system.
 */

export type CmsBgToken =
  | "background"
  | "surface"
  | "muted"
  | "primary"
  | "secondary"
  | "accent"

export type CmsTextToken =
  | "foreground"
  | "surface-foreground"
  | "muted-foreground"
  | "primary-foreground"
  | "secondary-foreground"
  | "accent-foreground"

export type CmsBorderToken = "border" | "primary" | "accent"

export type CmsTokens = {
  bg?: CmsBgToken
  text?: CmsTextToken
  border?: CmsBorderToken
}

/** Text token required when a background token is set (contrast-safe pairing). */
const REQUIRED_TEXT_FOR_BG: Record<CmsBgToken, CmsTextToken> = {
  background: "foreground",
  surface: "surface-foreground",
  muted: "muted-foreground",
  primary: "primary-foreground",
  secondary: "secondary-foreground",
  accent: "accent-foreground",
}

export function cmsTokensToClassName(tokens: CmsTokens | undefined): string {
  if (!tokens) return ""
  const classes: string[] = []
  if (tokens.bg) {
    classes.push(`bg-${tokens.bg}`)
    // Auto-pair readable text when the caller sets a background but no text role.
    classes.push(`text-${tokens.text ?? REQUIRED_TEXT_FOR_BG[tokens.bg]}`)
  } else if (tokens.text) {
    classes.push(`text-${tokens.text}`)
  }
  if (tokens.border) classes.push(`border-${tokens.border}`)

  const className = classes.join(" ")
  if (process.env.NODE_ENV !== "production") {
    for (const violation of findClassPairingViolations(className)) {
      console.warn(`[cms-bridge] ${violation.message}`)
    }
  }
  return className
}

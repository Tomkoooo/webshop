import type { ThemeTokenKey } from "@wse/sdk/theme/theme-token-keys"

export type CmsThemeHintState = "default" | "hover" | "focus" | "group-hover"

export type CmsThemeHintRole = "text" | "background" | "border" | "ring" | "other"

export type CmsThemeHint = {
  state: CmsThemeHintState
  role: CmsThemeHintRole
  className: string
  themeToken: ThemeTokenKey
  themeLabel: string
}

const STATE_PREFIXES: Array<{ prefix: string; state: CmsThemeHintState }> = [
  { prefix: "hover:", state: "hover" },
  { prefix: "focus-visible:", state: "focus" },
  { prefix: "group-hover:", state: "group-hover" },
]

const TAILWIND_TO_THEME: Record<string, ThemeTokenKey> = {
  primary: "primary",
  "primary-foreground": "primaryForeground",
  secondary: "secondary",
  "secondary-foreground": "secondaryForeground",
  accent: "accent",
  "accent-foreground": "accentForeground",
  background: "background",
  foreground: "foreground",
  surface: "surface",
  "surface-foreground": "surfaceForeground",
  border: "border",
  muted: "muted",
  "muted-foreground": "mutedForeground",
  success: "success",
  "success-foreground": "successForeground",
  warning: "warning",
  "warning-foreground": "warningForeground",
  error: "error",
  "error-foreground": "errorForeground",
}

const ROLE_PREFIXES: Array<{ prefix: string; role: CmsThemeHintRole }> = [
  { prefix: "bg-", role: "background" },
  { prefix: "text-", role: "text" },
  { prefix: "border-", role: "border" },
  { prefix: "ring-", role: "ring" },
]

function tailwindColorToThemeKey(colorPart: string): ThemeTokenKey | null {
  const base = colorPart.split("/")[0]?.trim()
  if (!base || base.startsWith("[") || base === "transparent" || base === "white" || base === "black") {
    return null
  }
  return TAILWIND_TO_THEME[base] ?? null
}

function splitState(className: string): { state: CmsThemeHintState; token: string } {
  for (const entry of STATE_PREFIXES) {
    if (className.startsWith(entry.prefix)) {
      return { state: entry.state, token: className.slice(entry.prefix.length) }
    }
  }
  return { state: "default", token: className }
}

/** Map Tailwind theme utility classes to admin theme token names. */
export function parseCmsThemeHints(className: string | undefined): CmsThemeHint[] {
  if (!className?.trim()) return []

  const hints: CmsThemeHint[] = []
  const seen = new Set<string>()

  for (const raw of className.split(/\s+/)) {
    if (!raw) continue
    const { state, token } = splitState(raw)

    for (const { prefix, role } of ROLE_PREFIXES) {
      if (!token.startsWith(prefix)) continue
      const themeKey = tailwindColorToThemeKey(token.slice(prefix.length))
      if (!themeKey) continue

      const dedupeKey = `${state}:${role}:${themeKey}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      hints.push({
        state,
        role,
        className: raw,
        themeToken: themeKey,
        themeLabel: themeKey,
      })
      break
    }
  }

  return hints
}

export function formatCmsThemeHintState(state: CmsThemeHintState): string {
  if (state === "default") return "Default"
  if (state === "hover") return "Hover"
  if (state === "focus") return "Focus"
  return "Group hover"
}

export function formatCmsThemeHintRole(role: CmsThemeHintRole): string {
  if (role === "text") return "Text"
  if (role === "background") return "Background"
  if (role === "border") return "Border"
  if (role === "ring") return "Ring"
  return "Style"
}

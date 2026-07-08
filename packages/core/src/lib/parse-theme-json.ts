import { THEME_TOKEN_KEYS, type ThemeTokenKey } from "@wse/sdk/theme/theme-token-keys"
import type { ThemeTokens } from "@wse/core/services/theme"

const KEY_ALIASES: Record<string, ThemeTokenKey> = {
  primary: "primary",
  primaryforeground: "primaryForeground",
  "primary-foreground": "primaryForeground",
  primary_foreground: "primaryForeground",
  secondary: "secondary",
  secondaryforeground: "secondaryForeground",
  "secondary-foreground": "secondaryForeground",
  secondary_foreground: "secondaryForeground",
  accent: "accent",
  accentforeground: "accentForeground",
  "accent-foreground": "accentForeground",
  accent_foreground: "accentForeground",
  background: "background",
  foreground: "foreground",
  surface: "surface",
  surfaceforeground: "surfaceForeground",
  "surface-foreground": "surfaceForeground",
  surface_foreground: "surfaceForeground",
  border: "border",
  muted: "muted",
  mutedforeground: "mutedForeground",
  "muted-foreground": "mutedForeground",
  muted_foreground: "mutedForeground",
  success: "success",
  successforeground: "successForeground",
  "success-foreground": "successForeground",
  success_foreground: "successForeground",
  warning: "warning",
  warningforeground: "warningForeground",
  "warning-foreground": "warningForeground",
  warning_foreground: "warningForeground",
  error: "error",
  errorforeground: "errorForeground",
  "error-foreground": "errorForeground",
  error_foreground: "errorForeground",
}

function normalizeKey(raw: string): ThemeTokenKey | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  let key = trimmed
  if (key.startsWith("--theme-")) key = key.slice("--theme-".length)
  if (key.startsWith("theme-")) key = key.slice("theme-".length)
  const alias = KEY_ALIASES[key.toLowerCase().replace(/\s+/g, "")]
  return alias ?? null
}

function normalizeColor(value: unknown): string | null {
  if (typeof value !== "string") return null
  const v = value.trim()
  if (!v) return null
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) {
    if (v.length === 4) {
      const r = v[1]
      const g = v[2]
      const b = v[3]
      return `#${r}${r}${g}${g}${b}${b}`.toUpperCase()
    }
    return v.toUpperCase()
  }
  return v
}

function collectEntries(
  node: unknown,
  out: Map<ThemeTokenKey, string>,
  depth = 0
): void {
  if (node == null || depth > 6) return
  if (typeof node !== "object" || Array.isArray(node)) return

  const record = node as Record<string, unknown>

  for (const [rawKey, rawValue] of Object.entries(record)) {
    const tokenKey = normalizeKey(rawKey)
    if (tokenKey && typeof rawValue === "string") {
      const color = normalizeColor(rawValue)
      if (color) out.set(tokenKey, color)
      continue
    }
    if (
      rawKey === "colors" ||
      rawKey === "theme" ||
      rawKey === "tokens" ||
      rawKey === "palette" ||
      rawKey === "defaultTheme"
    ) {
      collectEntries(rawValue, out, depth + 1)
    }
  }
}

export type ParseThemeJsonResult = {
  partial: Partial<ThemeTokens>
  appliedKeys: ThemeTokenKey[]
  unknownKeys: string[]
}

/**
 * Parse pasted or uploaded theme JSON (flat camelCase, kebab-case, nested `colors`, CSS var keys).
 */
export function parseThemeJsonInput(text: string): ParseThemeJsonResult {
  const trimmed = text.trim()
  if (!trimmed) {
    throw new Error("Empty JSON")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    throw new Error("Invalid JSON syntax")
  }

  const map = new Map<ThemeTokenKey, string>()
  collectEntries(parsed, map)

  const partial: Partial<ThemeTokens> = {}
  const appliedKeys: ThemeTokenKey[] = []
  for (const key of THEME_TOKEN_KEYS) {
    const value = map.get(key)
    if (value) {
      partial[key] = value
      appliedKeys.push(key)
    }
  }

  const known = new Set<string>(THEME_TOKEN_KEYS)
  const unknownKeys: string[] = []
  if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
    for (const key of Object.keys(parsed as Record<string, unknown>)) {
      const norm = normalizeKey(key)
      if (
        !norm &&
        key !== "colors" &&
        key !== "theme" &&
        key !== "tokens" &&
        key !== "palette" &&
        key !== "defaultTheme"
      ) {
        unknownKeys.push(key)
      } else if (norm && !known.has(norm) && !map.has(norm)) {
        unknownKeys.push(key)
      }
    }
  }

  if (appliedKeys.length === 0) {
    throw new Error(
      "No recognised theme keys. Use camelCase (primary, primaryForeground) or nested { \"colors\": { ... } }."
    )
  }

  return { partial, appliedKeys, unknownKeys }
}

export function mergeThemeTokens(base: ThemeTokens, partial: Partial<ThemeTokens>): ThemeTokens {
  return { ...base, ...partial }
}

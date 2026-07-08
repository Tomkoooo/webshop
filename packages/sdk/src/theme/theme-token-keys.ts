/** Keys of the runtime theme object; kept here to avoid circular imports with services/theme. */
export const THEME_TOKEN_KEYS = [
  "primary",
  "primaryForeground",
  "secondary",
  "secondaryForeground",
  "accent",
  "accentForeground",
  "background",
  "foreground",
  "surface",
  "surfaceForeground",
  "border",
  "muted",
  "mutedForeground",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "error",
  "errorForeground",
] as const

export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number]

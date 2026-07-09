/** Fixed admin chrome tokens — independent of storefront Theme v2. */
export const ADMIN_TOKEN_KEYS = [
  "background",
  "surface",
  "surfaceRaised",
  "overlay",
  "foreground",
  "muted",
  "subtle",
  "border",
  "borderStrong",
  "accent",
  "accentMuted",
  "ring",
  "success",
  "successForeground",
  "warning",
  "warningForeground",
  "error",
  "errorForeground",
] as const

export type AdminTokenKey = (typeof ADMIN_TOKEN_KEYS)[number]

export const ADMIN_LAYOUT_KEYS = [
  "radiusSm",
  "radiusMd",
  "radiusLg",
  "sidebarWidth",
  "contentMaxWidth",
] as const

export type AdminLayoutKey = (typeof ADMIN_LAYOUT_KEYS)[number]

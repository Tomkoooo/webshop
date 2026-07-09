import { ADMIN_LAYOUT_KEYS, ADMIN_TOKEN_KEYS, type AdminLayoutKey, type AdminTokenKey } from "./token-keys"

export type AdminTokens = Record<AdminTokenKey, string>

export type AdminLayoutTokens = Record<AdminLayoutKey, string>

/** Refined light operator shell — fixed palette (tCrm / shadcn), not DB-driven. */
export const DEFAULT_ADMIN_TOKENS: AdminTokens = {
  background: "oklch(0.99 0.002 286)",
  surface: "oklch(1 0 0)",
  surfaceRaised: "oklch(0.96 0.004 286)",
  overlay: "oklch(0.99 0.002 286)",
  foreground: "oklch(0.18 0.01 286)",
  muted: "oklch(0.48 0.02 286)",
  subtle: "oklch(0.58 0.02 286)",
  border: "oklch(0.91 0.006 286)",
  borderStrong: "oklch(0.84 0.01 286)",
  accent: "oklch(0.55 0.14 268)",
  accentMuted: "oklch(0.55 0.14 268 / 12%)",
  ring: "oklch(0.55 0.14 268 / 45%)",
  success: "oklch(0.62 0.15 155)",
  successForeground: "oklch(0.99 0 0)",
  warning: "oklch(0.78 0.14 85)",
  warningForeground: "oklch(0.28 0.05 85)",
  error: "oklch(0.58 0.22 27)",
  errorForeground: "oklch(0.99 0 0)",
}

export const DEFAULT_ADMIN_LAYOUT: AdminLayoutTokens = {
  radiusSm: "0.375rem",
  radiusMd: "0.5rem",
  radiusLg: "0.75rem",
  sidebarWidth: "16rem",
  contentMaxWidth: "80rem",
}

export { ADMIN_TOKEN_KEYS, ADMIN_LAYOUT_KEYS }
export type { AdminTokenKey, AdminLayoutKey }

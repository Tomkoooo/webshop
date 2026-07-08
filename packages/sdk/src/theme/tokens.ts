import { THEME_TOKEN_KEYS, type ThemeTokenKey } from "./theme-token-keys"

/** Flat color token map applied as CSS variables on <html>. */
export type ThemeTokens = Record<ThemeTokenKey, string>

export { THEME_TOKEN_KEYS }
export type { ThemeTokenKey }

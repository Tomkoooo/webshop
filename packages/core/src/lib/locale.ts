import { headers } from "next/headers"
import { cache } from "react"
import { BASE_CONTENT_LOCALE } from "@wse/sdk/i18n/constants"

export { BASE_CONTENT_LOCALE }

/** Set by `storefrontMiddleware` when a locale-prefixed path is rewritten. Absent = base locale. */
export const LOCALE_HEADER = "x-wse-locale"

/**
 * Resolves the active request locale. Sites without a `locales` config in their baked
 * `WSE_SITE_CONFIG_JSON` never set `LOCALE_HEADER`, so this always returns
 * `BASE_CONTENT_LOCALE` for them — identical to pre-i18n behavior.
 */
export const getRequestLocale = cache(async function getRequestLocale(): Promise<string> {
  const value = (await headers()).get(LOCALE_HEADER)
  return value && value.trim() ? value : BASE_CONTENT_LOCALE
})

/**
 * Strips a leading `/<locale>` path segment when `locale` is one of `supported`.
 * Returns `null` when the path has no locale prefix (including the bare default-locale URL,
 * which intentionally carries no prefix — see `storefrontMiddleware`).
 */
export function stripLocalePrefix(
  pathname: string,
  supported: readonly string[]
): { locale: string; rest: string } | null {
  for (const locale of supported) {
    const prefix = `/${locale}`
    if (pathname === prefix) return { locale, rest: "/" }
    if (pathname.startsWith(`${prefix}/`)) return { locale, rest: pathname.slice(prefix.length) }
  }
  return null
}

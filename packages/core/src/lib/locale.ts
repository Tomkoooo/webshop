import { headers } from "next/headers"
import { cache } from "react"
import {
  BASE_CONTENT_LOCALE,
  stripLocalePrefix as stripLocalePrefixShared,
} from "@wse/sdk/i18n/constants"

export { BASE_CONTENT_LOCALE, stripLocalePrefixShared as stripLocalePrefix }

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

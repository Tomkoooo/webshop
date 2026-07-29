/**
 * Locale that is always stored/read without any key suffix — i.e. exactly like every
 * template's content behaved before multi-locale support existed. Only non-base locales
 * get a `pageKey@locale` / `footer:<templateId>@locale` suffix (see `PageContentService`).
 */
export const BASE_CONTENT_LOCALE = "en"

/** Cookie that remembers the visitor's last-resolved locale for locale-enabled sites. */
export const LOCALE_COOKIE = "wse_locale"

/**
 * Prefixes a site-relative href with `/<locale>` for non-default locales, so internal
 * navigation (nav links, CTAs, "back to" links, hash anchors like `/#venue`) stays within
 * the current locale instead of silently dropping back to the default. Leaves external
 * URLs, protocol-relative URLs, and falsy hrefs untouched — safe to call unconditionally.
 */
export function localizeHref(href: string | undefined | null, locale?: string): string {
  if (!href) return href ?? ""
  if (!locale || locale === BASE_CONTENT_LOCALE) return href
  if (!href.startsWith("/") || href.startsWith("//")) return href
  const prefix = `/${locale}`
  if (href === prefix || href.startsWith(`${prefix}/`)) return href
  return `${prefix}${href}`
}

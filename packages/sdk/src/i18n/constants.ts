/**
 * Locale that is always stored/read without any key suffix — i.e. exactly like every
 * template's content behaved before multi-locale support existed. Only non-base locales
 * get a `pageKey@locale` / `footer:<templateId>@locale` suffix (see `PageContentService`).
 */
export const BASE_CONTENT_LOCALE = "en"

/** Cookie that remembers the visitor's last-resolved locale for locale-enabled sites. */
export const LOCALE_COOKIE = "wse_locale"

/**
 * Strips a leading `/<locale>` path segment when `locale` is one of `supported`.
 * Returns `null` when the path has no locale prefix (including the bare default-locale URL).
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

/**
 * Prefixes a site-relative href with `/<locale>` for non-default locales, so internal
 * navigation stays within the current language. Leaves external URLs, protocol-relative
 * URLs, and falsy hrefs untouched — safe to call unconditionally.
 */
export function localizeHref(
  href: string | undefined | null,
  locale?: string,
  defaultLocale: string = BASE_CONTENT_LOCALE
): string {
  if (!href) return href ?? ""
  if (!locale || locale === defaultLocale) return href
  if (!href.startsWith("/") || href.startsWith("//")) return href
  const prefix = `/${locale}`
  if (href === prefix || href.startsWith(`${prefix}/`)) return href
  if (href === "/") return prefix
  return `${prefix}${href}`
}

/**
 * Builds a locale-switch target from the current browser pathname (may already include
 * a `/hu` prefix). Default locale stays unprefixed.
 */
export function localeSwitchPath(
  pathname: string,
  toLocale: string,
  supported: readonly string[],
  defaultLocale: string = BASE_CONTENT_LOCALE
): string {
  const stripped = stripLocalePrefix(pathname || "/", supported)
  const rest = stripped?.rest ?? (pathname || "/")
  if (toLocale === defaultLocale) return rest
  return rest === "/" ? `/${toLocale}` : `/${toLocale}${rest}`
}

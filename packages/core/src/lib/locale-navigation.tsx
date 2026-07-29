"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react"
import Link from "next/link"
import { BASE_CONTENT_LOCALE, localizeHref } from "@wse/sdk/i18n/constants"
import { resolveCmsHref } from "@wse/core/lib/cms-href"

export type LocaleNavValue = {
  locale: string
  defaultLocale: string
  /** True when the deployment has more than one storefront locale. */
  enabled: boolean
}

const LocaleNavContext = createContext<LocaleNavValue>({
  locale: BASE_CONTENT_LOCALE,
  defaultLocale: BASE_CONTENT_LOCALE,
  enabled: false,
})

export function LocaleProvider({
  locale,
  defaultLocale = BASE_CONTENT_LOCALE,
  enabled = false,
  children,
}: LocaleNavValue & { children: ReactNode }) {
  const value = useMemo(
    () => ({
      locale: locale || defaultLocale,
      defaultLocale,
      enabled: Boolean(enabled),
    }),
    [locale, defaultLocale, enabled]
  )
  return <LocaleNavContext.Provider value={value}>{children}</LocaleNavContext.Provider>
}

export function useLocaleNav(): LocaleNavValue {
  return useContext(LocaleNavContext)
}

/** Localize an authored/CMS href for the active storefront locale. */
export function useLocalizedHref(href: string | undefined | null): string {
  const { locale, defaultLocale, enabled } = useLocaleNav()
  if (!href) return href ?? ""
  if (!enabled) return href
  return localizeHref(href, locale, defaultLocale)
}

/**
 * Full-document navigation that preserves locale. Prefer this over `router.push` on
 * multi-locale sites — middleware rewrites `/hu/...` → `/...`, so the App Router soft
 * cache can serve the wrong language under the new URL.
 */
export function useLocaleNavigate() {
  const { locale, defaultLocale, enabled } = useLocaleNav()
  return useCallback(
    (href: string) => {
      const target = enabled ? localizeHref(href, locale, defaultLocale) : href
      if (typeof window === "undefined") return
      window.location.assign(target)
    },
    [enabled, locale, defaultLocale]
  )
}

type LocaleLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string
  children: ReactNode
  /** When false, skip locale prefixing (rare — prefer leaving enabled). */
  localize?: boolean
}

/**
 * Storefront link that keeps the active locale in the URL.
 *
 * On multi-locale sites this renders a plain `<a>` (full page load) instead of Next
 * `<Link>`, because middleware rewrites make `/hu` and `/` share the same App Router
 * page identity and soft-nav RSC cache can show the wrong language until a second click.
 */
export function LocaleLink({
  href,
  children,
  className,
  localize = true,
  ...rest
}: LocaleLinkProps) {
  const { locale, defaultLocale, enabled } = useLocaleNav()
  const resolved = resolveCmsHref(href)

  if (resolved.external) {
    return (
      <a
        href={resolved.href}
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        {...rest}
      >
        {children}
      </a>
    )
  }

  const localized =
    localize && enabled
      ? localizeHref(resolved.href, locale, defaultLocale)
      : resolved.href

  if (enabled) {
    return (
      <a href={localized || "#"} className={className} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link href={localized || "#"} className={className} {...rest}>
      {children}
    </Link>
  )
}

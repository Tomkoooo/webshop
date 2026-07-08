import { getPublicAppBaseUrl } from "@wse/core/lib/app-base-url"
import type { SeoSettings } from "@wse/core/services/seo-settings"

export function resolveSitemapBaseUrl(seo: Pick<SeoSettings, "canonicalBaseUrl">): string {
  const fromSeo = seo.canonicalBaseUrl?.trim()
  if (fromSeo) return fromSeo.replace(/\/+$/, "")
  return getPublicAppBaseUrl()
}

export function absoluteSitemapUrl(baseUrl: string, path: string): string {
  if (path === "/" || path === "") return `${baseUrl}/`
  const normalized = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalized}`
}

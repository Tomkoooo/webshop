import type { MetadataRoute } from "next"
import { resolveSitemapBaseUrl } from "@wse/core/lib/sitemap/resolve-sitemap-base-url"
import { SeoSettingsService } from "@wse/core/services/seo-settings"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function robots(): Promise<MetadataRoute.Robots> {
  const seo = await SeoSettingsService.get()
  const baseUrl = resolveSitemapBaseUrl(seo)

  return {
    rules: {
      userAgent: "*",
      allow: seo.robotsIndex ? "/" : undefined,
      disallow: seo.robotsIndex
        ? ["/admin/", "/api/", "/auth/", "/checkout", "/cart", "/profile"]
        : "/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}

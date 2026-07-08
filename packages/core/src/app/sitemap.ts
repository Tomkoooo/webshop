import type { MetadataRoute } from "next"
import { buildStorefrontSitemap } from "@wse/core/services/storefront-sitemap"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildStorefrontSitemap()
}

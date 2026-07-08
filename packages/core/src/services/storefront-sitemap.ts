import type { MetadataRoute } from "next"
import dbConnect from "@wse/core/lib/db"
import Product from "@wse/core/models/Product"
import Category from "@wse/core/models/Category"
import { buildStorefrontSitemapEntries } from "@wse/core/lib/sitemap/build-storefront-sitemap"
import { resolveSitemapBaseUrl } from "@wse/core/lib/sitemap/resolve-sitemap-base-url"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { SeoSettingsService } from "@wse/core/services/seo-settings"
import { TemplateService } from "@wse/core/services/template"

type LeanProduct = { slug?: string; updatedAt?: Date | string }
type LeanCategory = { _id: unknown; slug?: string; updatedAt?: Date | string }

export async function buildStorefrontSitemap(): Promise<MetadataRoute.Sitemap> {
  const [seo, template] = await Promise.all([
    SeoSettingsService.get(),
    TemplateService.getDbActive(),
  ])
  const baseUrl = resolveSitemapBaseUrl(seo)
  const shopEnabled = isShopEnabled()

  let products: Array<{ slug: string; updatedAt?: Date | string }> = []
  let categories: Array<{ id: string; slug: string; updatedAt?: Date | string }> = []

  if (shopEnabled && template.manifest.deployment === "commerce") {
    await dbConnect()
    const [productRows, categoryRows] = await Promise.all([
      Product.find({ isActive: true, isVisible: true }).select("slug updatedAt").lean(),
      Category.find({}).select("slug updatedAt").lean(),
    ])
    products = (productRows as LeanProduct[])
      .filter((row) => Boolean(row.slug?.trim()))
      .map((row) => ({ slug: row.slug!.trim(), updatedAt: row.updatedAt }))
    categories = (categoryRows as LeanCategory[])
      .filter((row) => Boolean(row.slug?.trim()))
      .map((row) => ({
        id: String(row._id),
        slug: row.slug!.trim(),
        updatedAt: row.updatedAt,
      }))
  }

  return buildStorefrontSitemapEntries({
    baseUrl,
    template,
    shopEnabled,
    products,
    categories,
  })
}

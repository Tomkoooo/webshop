import type { MetadataRoute } from "next"
import type { TemplateModule } from "@wse/sdk/templates/types"
import { absoluteSitemapUrl } from "@wse/core/lib/sitemap/resolve-sitemap-base-url"

export type SitemapProductRow = {
  slug: string
  updatedAt?: Date | string | null
}

export type SitemapCategoryRow = {
  id: string
  slug: string
  updatedAt?: Date | string | null
}

export type BuildStorefrontSitemapInput = {
  baseUrl: string
  template: TemplateModule
  shopEnabled: boolean
  products?: SitemapProductRow[]
  categories?: SitemapCategoryRow[]
}

function toLastModified(value: Date | string | null | undefined): Date | undefined {
  if (!value) return undefined
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function entry(
  baseUrl: string,
  path: string,
  options: {
    lastModified?: Date
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"]
    priority?: number
  } = {}
): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteSitemapUrl(baseUrl, path),
    lastModified: options.lastModified,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  }
}

/** Public storefront URLs for the active template (pure builder — easy to unit test). */
export function buildStorefrontSitemapEntries({
  baseUrl,
  template,
  shopEnabled,
  products = [],
  categories = [],
}: BuildStorefrontSitemapInput): MetadataRoute.Sitemap {
  const seen = new Set<string>()
  const rows: MetadataRoute.Sitemap = []

  const push = (item: MetadataRoute.Sitemap[number]) => {
    if (seen.has(item.url)) return
    seen.add(item.url)
    rows.push(item)
  }

  push(
    entry(baseUrl, "/", {
      changeFrequency: "daily",
      priority: 1,
    })
  )

  for (const slug of template.manifest.capabilities.staticPages) {
    if (!template.staticPages[slug]) continue
    push(
      entry(baseUrl, `/${slug}`, {
        changeFrequency: "monthly",
        priority: 0.7,
      })
    )
  }

  const commerceTemplate = template.manifest.deployment === "commerce"
  if (!shopEnabled || !commerceTemplate) {
    return rows
  }

  push(
    entry(baseUrl, "/shop", {
      changeFrequency: "daily",
      priority: 0.9,
    })
  )

  for (const category of categories) {
    if (!category.slug?.trim() || !category.id?.trim()) continue
    push(
      entry(baseUrl, `/shop?category=${encodeURIComponent(category.id)}`, {
        lastModified: toLastModified(category.updatedAt),
        changeFrequency: "weekly",
        priority: 0.75,
      })
    )
  }

  for (const product of products) {
    if (!product.slug?.trim()) continue
    push(
      entry(baseUrl, `/products/${encodeURIComponent(product.slug)}`, {
        lastModified: toLastModified(product.updatedAt),
        changeFrequency: "weekly",
        priority: 0.8,
      })
    )
  }

  return rows
}

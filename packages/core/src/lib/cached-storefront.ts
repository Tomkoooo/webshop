import { unstable_cache } from "next/cache"
import { cache } from "react"
import { SeoSettingsService } from "@wse/core/services/seo-settings"
import { BrandingSettingsService } from "@wse/core/services/branding-settings"
import { FooterSettingsService } from "@wse/core/services/footer-settings"
import { ThemeService } from "@wse/core/services/theme"
import { TemplateService } from "@wse/core/services/template"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import { ShopContentService } from "@wse/core/services/shop-content"
import { CategoryService } from "@wse/core/services/category"
import { PageContentService } from "@wse/core/services/page-content"
import { STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"
import { BASE_CONTENT_LOCALE } from "@wse/sdk/i18n/constants"
import type { TemplateModule } from "@wse/sdk/templates/types"
import dbConnect from "@wse/core/lib/db"
import LegalDocument from "@wse/core/models/LegalDocument"

const REVALIDATE_SECONDS = 60

export const getCachedSeoSettings = unstable_cache(
  async () => SeoSettingsService.get(),
  ["storefront-seo-settings"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.seo] }
)

export const getCachedBrandingSettings = unstable_cache(
  async () => BrandingSettingsService.get(),
  ["storefront-branding-settings"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.branding] }
)

export async function getCachedFooterSettingsForTemplate(template: TemplateModule, locale?: string) {
  const templateId = template.manifest.id
  return unstable_cache(
    async () => FooterSettingsService.getForTemplate(template, locale),
    ["storefront-footer-settings", templateId, locale ?? BASE_CONTENT_LOCALE],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [STOREFRONT_CACHE_TAGS.footer, `footer:${templateId}`],
    }
  )()
}

/** @deprecated Prefer getCachedFooterSettingsForTemplate once the active template is known. */
export const getCachedFooterSettings = unstable_cache(
  async () => FooterSettingsService.get(),
  ["storefront-footer-settings-legacy"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.footer] }
)

export const getCachedActiveTemplateInfo = unstable_cache(
  async () => TemplateService.getActiveInfo(),
  ["storefront-active-template-info"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.template] }
)

export async function getCachedThemeForTemplate(template: TemplateModule) {
  const templateId = template.manifest.id
  return unstable_cache(
    async () => ThemeService.getMergedForTemplate(template),
    ["storefront-theme", templateId],
    { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.theme, STOREFRONT_CACHE_TAGS.template] }
  )()
}

export async function getCachedFeatureFlag(key: string, fallback: boolean) {
  return unstable_cache(
    async () => FeatureFlagService.isEnabled(key, fallback),
    ["storefront-feature-flag", key, String(fallback)],
    { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.flags] }
  )()
}

export const getCachedShopContent = unstable_cache(
  async () => ShopContentService.getAll(),
  ["storefront-shop-content"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.shopContent] }
)

export const getCachedCategoryTree = unstable_cache(
  async () => CategoryService.getTree(),
  ["storefront-category-tree"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.categories] }
)

export const getCachedCategories = unstable_cache(
  async () => CategoryService.getAll(),
  ["storefront-categories-flat"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.categories] }
)

export async function getCachedPageContent<T = unknown>(templateId: string, pageKey: string, locale?: string) {
  return unstable_cache(
    async () => PageContentService.get<T>(templateId, pageKey, locale),
    ["storefront-page-content", templateId, pageKey, locale ?? BASE_CONTENT_LOCALE],
    {
      revalidate: REVALIDATE_SECONDS,
      tags: [
        STOREFRONT_CACHE_TAGS.homepage,
        STOREFRONT_CACHE_TAGS.shopContent,
        STOREFRONT_CACHE_TAGS.template,
      ],
    }
  )()
}

export type StorefrontLegalLink = {
  key: string
  title: string
  href: string
  uploadedAt?: string | Date
}

export const getCachedLegalLinks = unstable_cache(
  async (): Promise<StorefrontLegalLink[]> => {
    await dbConnect()
    const docs = (await LegalDocument.find({}).lean()) as Array<{
      key: string
      title: string
      fileName: string
      uploadedAt?: string | Date
    }>
    return docs.map((doc) => ({
      key: doc.key,
      title: doc.title,
      href: `/api/media/${doc.fileName}`,
      uploadedAt: doc.uploadedAt,
    }))
  },
  ["storefront-legal-links"],
  { revalidate: REVALIDATE_SECONDS, tags: [STOREFRONT_CACHE_TAGS.legal] }
)

/** Per-request dedupe on top of unstable_cache (metadata + layout same request). */
export const getRequestSeoSettings = cache(getCachedSeoSettings)
export const getRequestBrandingSettings = cache(getCachedBrandingSettings)
export const getRequestFooterSettings = cache(getCachedFooterSettings)
export const getRequestActiveTemplateInfo = cache(getCachedActiveTemplateInfo)
export const getRequestShopContent = cache(getCachedShopContent)
export const getRequestCategoryTree = cache(getCachedCategoryTree)
export const getRequestCategories = cache(getCachedCategories)
export const getRequestPageContent = cache(getCachedPageContent)

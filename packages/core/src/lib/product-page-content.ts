import { PageContentService } from "@wse/core/services/page-content"

export const PRODUCT_PDP_PAGE_KEY_PREFIX = "page:pdp:product:" as const

export function productPdpPageKey(slug: string): string {
  return `${PRODUCT_PDP_PAGE_KEY_PREFIX}${slug}`
}

export function parseProductSlugFromPdpPageKey(pageKey: string): string | null {
  if (!pageKey.startsWith(PRODUCT_PDP_PAGE_KEY_PREFIX)) return null
  const slug = pageKey.slice(PRODUCT_PDP_PAGE_KEY_PREFIX.length).trim()
  return slug.length > 0 ? slug : null
}

function deepMergeRecords(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (value === undefined) continue
    const baseVal = out[key]
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseVal &&
      typeof baseVal === "object" &&
      !Array.isArray(baseVal)
    ) {
      out[key] = deepMergeRecords(
        baseVal as Record<string, unknown>,
        value as Record<string, unknown>
      )
    } else {
      out[key] = value
    }
  }
  return out
}

export function mergePdpContent<T>(
  templateDefault: T,
  scoped: Partial<T> | null | undefined
): T {
  if (!scoped) return templateDefault
  return deepMergeRecords(
    templateDefault as Record<string, unknown>,
    scoped as Record<string, unknown>
  ) as T
}

async function getScopedOverrides<T>(
  templateId: string,
  productSlug: string
): Promise<Partial<T> | null> {
  const scopedKey = productPdpPageKey(productSlug)
  const hasStored = await PageContentService.hasStoredContent(templateId, scopedKey)
  if (!hasStored) return null
  return PageContentService.getPublished<Partial<T>>(templateId, scopedKey)
}

/** Live storefront: merge template `page:pdp` with scoped `page:pdp:product:{slug}` overrides. */
export async function getProductPdpContent<T = unknown>(
  templateId: string,
  productSlug: string
): Promise<T> {
  const frame = await PageContentService.getPublished<T>(templateId, "page:pdp")
  const scoped = await getScopedOverrides<T>(templateId, productSlug)
  return mergePdpContent(frame, scoped)
}

/** Editor baseline for per-product visual PDP. */
export async function getProductPdpDraft<T = unknown>(
  templateId: string,
  productSlug: string
): Promise<T> {
  const frame = await PageContentService.getDraft<T>(templateId, "page:pdp")
  const scopedKey = productPdpPageKey(productSlug)
  const hasStored = await PageContentService.hasStoredContent(templateId, scopedKey)
  if (!hasStored) return frame
  const scoped = await PageContentService.getDraft<T>(templateId, scopedKey)
  return mergePdpContent(frame, scoped as Partial<T>)
}

export function templateSupportsPerProductPdpCms(
  capabilities: { perProductPdpCms?: boolean } | undefined
): boolean {
  return capabilities?.perProductPdpCms === true
}

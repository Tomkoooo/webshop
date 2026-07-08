import { revalidatePath } from "next/cache"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"
import { revalidateStorefrontSitemap } from "@wse/core/lib/sitemap/revalidate-storefront-sitemap"
import { homepageSnapshotSchema } from "@wse/core/features/homepage-cms/types/homepage-schema"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { getDefaultHomepageSnapshot } from "@wse/core/features/homepage-cms/utils/default-snapshot"
import { ShopContentService } from "@wse/core/services/shop-content"

const DRAFT_KEY = "homepage_snapshot_draft"
const PUBLISHED_KEY = "homepage_snapshot_published"
const SECTION = "homepage_cms"

function parseSnapshot(input: string | undefined | null): HomepageSnapshot | null {
  if (!input) return null
  try {
    const parsed = JSON.parse(input)
    return homepageSnapshotSchema.parse(parsed)
  } catch {
    return null
  }
}

export class HomepageCmsService {
  static async getPublished(): Promise<HomepageSnapshot> {
    const all = await ShopContentService.getAll()
    const published = parseSnapshot(all[PUBLISHED_KEY])
    if (published) return published
    return getDefaultHomepageSnapshot()
  }

  static async getDraft(): Promise<HomepageSnapshot> {
    const all = await ShopContentService.getAll()
    const draft = parseSnapshot(all[DRAFT_KEY])
    if (draft) return draft
    const published = parseSnapshot(all[PUBLISHED_KEY])
    if (published) return published
    return getDefaultHomepageSnapshot()
  }

  static async saveDraft(snapshot: HomepageSnapshot): Promise<HomepageSnapshot> {
    const valid = homepageSnapshotSchema.parse(snapshot)
    await ShopContentService.update(DRAFT_KEY, JSON.stringify(valid), SECTION)
    return valid
  }

  static async publishDraft(): Promise<HomepageSnapshot> {
    const draft = await this.getDraft()
    await ShopContentService.update(PUBLISHED_KEY, JSON.stringify(draft), SECTION)
    await revalidatePath("/")
    revalidateStorefrontSitemap()
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.homepage, STOREFRONT_CACHE_TAGS.shopContent)
    return draft
  }

  static async discardDraft(): Promise<HomepageSnapshot> {
    const all = await ShopContentService.getAll()
    const published = parseSnapshot(all[PUBLISHED_KEY]) ?? getDefaultHomepageSnapshot()
    await ShopContentService.update(DRAFT_KEY, JSON.stringify(published), SECTION)
    return published
  }
}

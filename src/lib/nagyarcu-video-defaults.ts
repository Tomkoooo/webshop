import type { HomepageSnapshot, VideoCarouselBlock } from "@/features/homepage-cms/types/block-types"
import { getDeploymentKey } from "@/config/deployments-registry"
import { insertionIndexForHomepageBlockType } from "@/features/homepage-cms/utils/homepage-block-allowlist"
import { parseVideoEmbedUrl } from "@/lib/video-embed"

/** Canonical TikTok videos for Én, a nagyarcú — CMS can override once stored in TemplateContent. */
export const NAGYARCU_DEFAULT_VIDEO_URLS = [
  "https://www.tiktok.com/@enanagyarcu/video/7663085712421555478",
  "https://www.tiktok.com/@enanagyarcu/video/7665276902130584834",
  "https://www.tiktok.com/@enanagyarcu/video/7664940178548509974",
  "https://www.tiktok.com/@enanagyarcu/video/7664138317377654038",
  "https://www.tiktok.com/@enanagyarcu/video/7663417860525493527",
] as const

export const NAGYARCU_DEPLOYMENT_KEY = "nagyarcu-shop"

export function createNagyarcuVideoCarouselBlock(
  existingId?: string
): Extract<HomepageSnapshot["blocks"][number], { type: "videoCarousel" }> {
  return {
    id: existingId || "video-carousel-nagyarcu",
    type: "videoCarousel",
    enabled: true,
    data: {
      title: "Videók",
      items: NAGYARCU_DEFAULT_VIDEO_URLS.map((url) => ({ url })),
    },
  }
}

export const nagyarcuVideoCarouselBlock = createNagyarcuVideoCarouselBlock()

/**
 * For nagyarcu-shop:
 * - missing videoCarousel → inject hardcoded TikTok defaults
 * - block exists with only unparseable items (failed embed paste) → replace with defaults
 * - block exists empty or with playable videos → CMS/database wins
 */
export function withNagyarcuVideoCarouselFallback(
  snapshot: HomepageSnapshot,
  deploymentKey = getDeploymentKey()
): HomepageSnapshot {
  if (deploymentKey !== NAGYARCU_DEPLOYMENT_KEY) return snapshot

  const existingIndex = snapshot.blocks.findIndex((block) => block.type === "videoCarousel")
  if (existingIndex >= 0) {
    const existing = snapshot.blocks[existingIndex] as VideoCarouselBlock
    const items = existing.data.items ?? []
    const hasPlayable = items.some((item) => Boolean(parseVideoEmbedUrl(item.url).embedUrl))
    if (hasPlayable || items.length === 0) return snapshot

    const blocks = [...snapshot.blocks]
    blocks[existingIndex] = createNagyarcuVideoCarouselBlock(existing.id)
    return { ...snapshot, blocks }
  }

  const nextBlock = createNagyarcuVideoCarouselBlock()
  const blocks = [...snapshot.blocks]
  const allowedOrder = [
    "hero",
    "about",
    "videoCarousel",
    "testimonials",
    "gallery",
    "features",
    "productGrid",
    "contact",
  ] as const
  const insertAt = insertionIndexForHomepageBlockType(blocks, "videoCarousel", [...allowedOrder])
  blocks.splice(insertAt, 0, nextBlock)
  return { ...snapshot, blocks }
}

/** Upsert the video carousel into a snapshot (used by seed scripts). */
export function upsertNagyarcuVideoCarouselBlock(snapshot: HomepageSnapshot): HomepageSnapshot {
  const blocks = [...snapshot.blocks]
  const existingIndex = blocks.findIndex((block) => block.type === "videoCarousel")
  const nextBlock = createNagyarcuVideoCarouselBlock(
    existingIndex >= 0 ? blocks[existingIndex]!.id : undefined
  )

  if (existingIndex >= 0) {
    blocks[existingIndex] = nextBlock
    return { ...snapshot, blocks }
  }

  const aboutIndex = blocks.findIndex((block) => block.type === "about")
  const insertAt = aboutIndex >= 0 ? aboutIndex + 1 : blocks.length
  blocks.splice(insertAt, 0, nextBlock)
  return { ...snapshot, blocks }
}

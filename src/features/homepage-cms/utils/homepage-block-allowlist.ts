import type { HomepageBlockType, HomepageSnapshot } from "@/features/homepage-cms/types/block-types"
import type { PageDefinition } from "@/templates/types"

/** Canonical block identifiers for the homepage block editor (schema-aligned). */
export const ALL_HOMEPAGE_BLOCK_TYPES: HomepageBlockType[] = [
  "hero",
  "about",
  "videoCarousel",
  "features",
  "productGrid",
  "contact",
  "testimonials",
  "cta",
  "gallery",
  "richText",
  "divider",
]

const ALL_SET = new Set<string>(ALL_HOMEPAGE_BLOCK_TYPES)

type HomePageDefPick = Pick<PageDefinition<unknown>, "allowedBlocks" | "defaultContent" | "cmsPageKind">

/** Resolve ordered allowlist for a template homepage: explicit `allowedBlocks`, else baseline block types from `defaultContent`. */
export function resolveAllowedHomepageBlockTypes(pageDef: HomePageDefPick): HomepageBlockType[] {
  const raw = pageDef.allowedBlocks
  if (raw && raw.length > 0) {
    const out: HomepageBlockType[] = []
    for (const t of raw) {
      if (ALL_SET.has(t)) out.push(t as HomepageBlockType)
    }
    return out
  }
  const snap = pageDef.defaultContent as HomepageSnapshot | undefined
  if (snap?.blocks?.length) {
    const seen = new Set<HomepageBlockType>()
    const order: HomepageBlockType[] = []
    for (const b of snap.blocks) {
      if (!seen.has(b.type)) {
        seen.add(b.type)
        order.push(b.type)
      }
    }
    return order
  }
  return [...ALL_HOMEPAGE_BLOCK_TYPES]
}

/**
 * Drops blocks whose type isn't allowed, removes duplicate ids (first wins before sort),
 * then sorts by `allowedOrder` (multiple blocks of the same type are kept when ids differ).
 */
export function pruneAndDedupeHomepageBlocks(
  snapshot: HomepageSnapshot,
  allowedOrder: HomepageBlockType[]
): HomepageSnapshot {
  if (allowedOrder.length === 0) return snapshot
  const allowed = new Set<HomepageBlockType>(allowedOrder)
  const seenIds = new Set<string>()
  const kept: HomepageSnapshot["blocks"] = []
  for (const b of snapshot.blocks) {
    if (!allowed.has(b.type) || seenIds.has(b.id)) continue
    seenIds.add(b.id)
    kept.push(b)
  }
  const rank = (t: HomepageBlockType) => {
    const i = allowedOrder.indexOf(t)
    return i === -1 ? 999 : i
  }
  kept.sort((a, b) => rank(a.type) - rank(b.type))
  return { ...snapshot, blocks: kept }
}

/** Insert position so the new block follows template section order (`allowedOrder`). */
export function insertionIndexForHomepageBlockType(
  blocks: HomepageSnapshot["blocks"],
  type: HomepageBlockType,
  allowedOrder: HomepageBlockType[]
): number {
  const idx = allowedOrder.indexOf(type)
  if (idx <= 0) return 0
  for (let i = idx - 1; i >= 0; i--) {
    const pred = allowedOrder[i]!
    const pos = blocks.map((b) => b.type).lastIndexOf(pred)
    if (pos !== -1) return pos + 1
  }
  return 0
}

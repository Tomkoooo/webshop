import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"
import { deepMerge } from "./deep-merge"
import type { HomepageBlockPatch } from "./payload-schema"

export function applyHomepageBlockPatches(
  snapshot: HomepageSnapshot,
  patches: HomepageBlockPatch[]
): HomepageSnapshot {
  const blocks = snapshot.blocks.map((block) => {
    const patch = patches.find((p) =>
      p.matchBy === "id" ? p.target === block.id : p.target === block.type
    )
    if (!patch) return block

    const next = { ...block }
    if (patch.enabled !== undefined) {
      next.enabled = patch.enabled
    }
    if (patch.data && Object.keys(patch.data).length > 0) {
      next.data = deepMerge(
        block.data as Record<string, unknown>,
        patch.data
      ) as typeof block.data
    }
    return next
  })

  return { ...snapshot, blocks }
}

/** First enabled block per type (same rule as VisualHomepageEditor inline edit). */
export function findHomepageBlockByType(
  snapshot: HomepageSnapshot,
  type: string
) {
  return snapshot.blocks.find((b) => b.type === type && b.enabled)
}

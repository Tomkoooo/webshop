import type { HomepageBlock, HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"

function cloneBlock<T extends HomepageBlock>(block: T): T {
  return structuredClone(block)
}

/**
 * Older saves (or migrations) sometimes dropped blocks while the template baseline still declares them.
 * Re-insert missing blocks from **`reference`** by block id in canonical order relative to neighbours.
 */
export function insertMissingHomepageBlocks(
  persisted: HomepageSnapshot,
  reference: HomepageSnapshot
): HomepageSnapshot {
  const presentIds = new Set(persisted.blocks.map((b) => b.id))
  const missing = reference.blocks.filter((b) => !presentIds.has(b.id))
  if (missing.length === 0) return persisted

  const next = [...persisted.blocks]
  for (const block of missing) {
    const refIdx = reference.blocks.findIndex((b) => b.id === block.id)
    const predecessor: HomepageBlock | undefined =
      refIdx > 0 ? reference.blocks[refIdx - 1] : undefined
    const insertion = cloneBlock(block)

    if (!predecessor) {
      next.unshift(insertion)
      continue
    }

    let anchor = -1
    for (let i = next.length - 1; i >= 0; i--) {
      if (next[i]!.id === predecessor.id) {
        anchor = i
        break
      }
    }
    if (anchor === -1) {
      next.push(insertion)
    } else {
      next.splice(anchor + 1, 0, insertion)
    }
  }

  return { ...persisted, blocks: next }
}

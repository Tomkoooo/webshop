import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"

export function cloneSnapshot(snapshot: HomepageSnapshot): HomepageSnapshot {
  return JSON.parse(JSON.stringify(snapshot)) as HomepageSnapshot
}

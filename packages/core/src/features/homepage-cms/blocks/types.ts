import type { HomepageBlock, HomepageBlockType } from "@wse/core/features/homepage-cms/types/block-types"

export type BlockDefinition<T extends HomepageBlockType = HomepageBlockType> = {
  type: T
  label: string
  create: () => Extract<HomepageBlock, { type: T }>
}

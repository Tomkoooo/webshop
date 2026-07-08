"use client"

import { Gallery } from "@wse/core/components/sections/Gallery"
import type { GalleryBlock } from "@wse/core/features/homepage-cms/types/block-types"

export function GalleryBlockView({ block }: { block: GalleryBlock }) {
  return <Gallery title={block.data.title} items={block.data.items} />
}

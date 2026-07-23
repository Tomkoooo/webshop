"use client"

import { VideoCarousel } from "@/components/sections/VideoCarousel"
import type { VideoCarouselBlock } from "@/features/homepage-cms/types/block-types"

export function VideoCarouselBlockView({ block }: { block: VideoCarouselBlock }) {
  return <VideoCarousel title={block.data.title} items={block.data.items} />
}

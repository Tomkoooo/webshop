import type { ComponentType } from "react"
import type { HomepageBlockType } from "@/features/homepage-cms/types/block-types"
import { HeroBlockView } from "@/features/homepage-cms/blocks/hero/View"
import { AboutBlockView } from "@/features/homepage-cms/blocks/about/View"
import { VideoCarouselBlockView } from "@/features/homepage-cms/blocks/videoCarousel/View"
import { FeaturesBlockView } from "@/features/homepage-cms/blocks/features/View"
import { ProductGridBlockView } from "@/features/homepage-cms/blocks/productGrid/View"
import { ContactBlockView } from "@/features/homepage-cms/blocks/contact/View"
import { TestimonialsBlockView } from "@/features/homepage-cms/blocks/testimonials/View"
import { CtaBlockView } from "@/features/homepage-cms/blocks/cta/View"
import { GalleryBlockView } from "@/features/homepage-cms/blocks/gallery/View"
import { RichTextBlockView } from "@/features/homepage-cms/blocks/richText/View"
import { DividerBlockView } from "@/features/homepage-cms/blocks/divider/View"

export const BLOCK_VIEWS: Record<HomepageBlockType, ComponentType<any>> = {
  hero: HeroBlockView,
  about: AboutBlockView,
  videoCarousel: VideoCarouselBlockView,
  features: FeaturesBlockView,
  productGrid: ProductGridBlockView,
  contact: ContactBlockView,
  testimonials: TestimonialsBlockView,
  cta: CtaBlockView,
  gallery: GalleryBlockView,
  richText: RichTextBlockView,
  divider: DividerBlockView,
}

export function getView(type: HomepageBlockType) {
  return BLOCK_VIEWS[type]
}

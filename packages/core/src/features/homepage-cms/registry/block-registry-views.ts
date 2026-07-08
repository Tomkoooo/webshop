import type { ComponentType } from "react"
import type { HomepageBlockType } from "@wse/core/features/homepage-cms/types/block-types"
import { HeroBlockView } from "@wse/core/features/homepage-cms/blocks/hero/View"
import { AboutBlockView } from "@wse/core/features/homepage-cms/blocks/about/View"
import { FeaturesBlockView } from "@wse/core/features/homepage-cms/blocks/features/View"
import { ProductGridBlockView } from "@wse/core/features/homepage-cms/blocks/productGrid/View"
import { ContactBlockView } from "@wse/core/features/homepage-cms/blocks/contact/View"
import { TestimonialsBlockView } from "@wse/core/features/homepage-cms/blocks/testimonials/View"
import { CtaBlockView } from "@wse/core/features/homepage-cms/blocks/cta/View"
import { GalleryBlockView } from "@wse/core/features/homepage-cms/blocks/gallery/View"
import { RichTextBlockView } from "@wse/core/features/homepage-cms/blocks/richText/View"
import { DividerBlockView } from "@wse/core/features/homepage-cms/blocks/divider/View"

export const BLOCK_VIEWS: Record<HomepageBlockType, ComponentType<any>> = {
  hero: HeroBlockView,
  about: AboutBlockView,
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

import type { ComponentType } from "react"
import type { HomepageBlockType } from "@/features/homepage-cms/types/block-types"
import { HeroBlockEditor } from "@/features/homepage-cms/blocks/hero/Editor"
import { AboutBlockEditor } from "@/features/homepage-cms/blocks/about/Editor"
import { VideoCarouselBlockEditor } from "@/features/homepage-cms/blocks/videoCarousel/Editor"
import { FeaturesBlockEditor } from "@/features/homepage-cms/blocks/features/Editor"
import { ProductGridBlockEditor } from "@/features/homepage-cms/blocks/productGrid/Editor"
import { ContactBlockEditor } from "@/features/homepage-cms/blocks/contact/Editor"
import { TestimonialsBlockEditor } from "@/features/homepage-cms/blocks/testimonials/Editor"
import { CtaBlockEditor } from "@/features/homepage-cms/blocks/cta/Editor"
import { GalleryBlockEditor } from "@/features/homepage-cms/blocks/gallery/Editor"
import { RichTextBlockEditor } from "@/features/homepage-cms/blocks/richText/Editor"
import { DividerBlockEditor } from "@/features/homepage-cms/blocks/divider/Editor"

export const BLOCK_EDITORS: Record<HomepageBlockType, ComponentType<any>> = {
  hero: HeroBlockEditor,
  about: AboutBlockEditor,
  videoCarousel: VideoCarouselBlockEditor,
  features: FeaturesBlockEditor,
  productGrid: ProductGridBlockEditor,
  contact: ContactBlockEditor,
  testimonials: TestimonialsBlockEditor,
  cta: CtaBlockEditor,
  gallery: GalleryBlockEditor,
  richText: RichTextBlockEditor,
  divider: DividerBlockEditor,
}

export function getEditor(type: HomepageBlockType) {
  return BLOCK_EDITORS[type]
}

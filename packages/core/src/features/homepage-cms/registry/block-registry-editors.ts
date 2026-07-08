import type { ComponentType } from "react"
import type { HomepageBlockType } from "@wse/core/features/homepage-cms/types/block-types"
import { HeroBlockEditor } from "@wse/core/features/homepage-cms/blocks/hero/Editor"
import { AboutBlockEditor } from "@wse/core/features/homepage-cms/blocks/about/Editor"
import { FeaturesBlockEditor } from "@wse/core/features/homepage-cms/blocks/features/Editor"
import { ProductGridBlockEditor } from "@wse/core/features/homepage-cms/blocks/productGrid/Editor"
import { ContactBlockEditor } from "@wse/core/features/homepage-cms/blocks/contact/Editor"
import { TestimonialsBlockEditor } from "@wse/core/features/homepage-cms/blocks/testimonials/Editor"
import { CtaBlockEditor } from "@wse/core/features/homepage-cms/blocks/cta/Editor"
import { GalleryBlockEditor } from "@wse/core/features/homepage-cms/blocks/gallery/Editor"
import { RichTextBlockEditor } from "@wse/core/features/homepage-cms/blocks/richText/Editor"
import { DividerBlockEditor } from "@wse/core/features/homepage-cms/blocks/divider/Editor"

export const BLOCK_EDITORS: Record<HomepageBlockType, ComponentType<any>> = {
  hero: HeroBlockEditor,
  about: AboutBlockEditor,
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

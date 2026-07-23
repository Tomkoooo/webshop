import type { HomepageBlockType } from "@/features/homepage-cms/types/block-types"
import type { BlockDefinition } from "@/features/homepage-cms/blocks/types"
import { heroDefinition } from "@/features/homepage-cms/blocks/hero/definition"
import { aboutDefinition } from "@/features/homepage-cms/blocks/about/definition"
import { videoCarouselDefinition } from "@/features/homepage-cms/blocks/videoCarousel/definition"
import { featuresDefinition } from "@/features/homepage-cms/blocks/features/definition"
import { productGridDefinition } from "@/features/homepage-cms/blocks/productGrid/definition"
import { contactDefinition } from "@/features/homepage-cms/blocks/contact/definition"
import { testimonialsDefinition } from "@/features/homepage-cms/blocks/testimonials/definition"
import { ctaDefinition } from "@/features/homepage-cms/blocks/cta/definition"
import { galleryDefinition } from "@/features/homepage-cms/blocks/gallery/definition"
import { richTextDefinition } from "@/features/homepage-cms/blocks/richText/definition"
import { dividerDefinition } from "@/features/homepage-cms/blocks/divider/definition"
import { BLOCK_VIEWS, getView } from "./block-registry-views"
import { BLOCK_EDITORS, getEditor } from "./block-registry-editors"

export { BLOCK_VIEWS, getView } from "./block-registry-views"
export { BLOCK_EDITORS, getEditor } from "./block-registry-editors"

export const BLOCK_DEFINITIONS: { [K in HomepageBlockType]: BlockDefinition<K> } = {
  hero: heroDefinition,
  about: aboutDefinition,
  videoCarousel: videoCarouselDefinition,
  features: featuresDefinition,
  productGrid: productGridDefinition,
  contact: contactDefinition,
  testimonials: testimonialsDefinition,
  cta: ctaDefinition,
  gallery: galleryDefinition,
  richText: richTextDefinition,
  divider: dividerDefinition,
}

export function getDefinition(type: HomepageBlockType) {
  return BLOCK_DEFINITIONS[type]
}

export function getAllDefinitions() {
  return Object.values(BLOCK_DEFINITIONS)
}

import type { HomepageBlockType } from "@wse/core/features/homepage-cms/types/block-types"
import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"
import { heroDefinition } from "@wse/core/features/homepage-cms/blocks/hero/definition"
import { aboutDefinition } from "@wse/core/features/homepage-cms/blocks/about/definition"
import { featuresDefinition } from "@wse/core/features/homepage-cms/blocks/features/definition"
import { productGridDefinition } from "@wse/core/features/homepage-cms/blocks/productGrid/definition"
import { contactDefinition } from "@wse/core/features/homepage-cms/blocks/contact/definition"
import { testimonialsDefinition } from "@wse/core/features/homepage-cms/blocks/testimonials/definition"
import { ctaDefinition } from "@wse/core/features/homepage-cms/blocks/cta/definition"
import { galleryDefinition } from "@wse/core/features/homepage-cms/blocks/gallery/definition"
import { richTextDefinition } from "@wse/core/features/homepage-cms/blocks/richText/definition"
import { dividerDefinition } from "@wse/core/features/homepage-cms/blocks/divider/definition"
import { BLOCK_VIEWS, getView } from "./block-registry-views"
import { BLOCK_EDITORS, getEditor } from "./block-registry-editors"

export { BLOCK_VIEWS, getView } from "./block-registry-views"
export { BLOCK_EDITORS, getEditor } from "./block-registry-editors"

export const BLOCK_DEFINITIONS: { [K in HomepageBlockType]: BlockDefinition<K> } = {
  hero: heroDefinition,
  about: aboutDefinition,
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

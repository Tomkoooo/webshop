import { revalidateTag } from "next/cache"

/** Next.js cache tags for cross-request storefront data (see cached-storefront.ts). */
export const STOREFRONT_CACHE_TAGS = {
  seo: "storefront-seo",
  branding: "storefront-branding",
  footer: "storefront-footer",
  theme: "storefront-theme",
  template: "storefront-template",
  flags: "storefront-flags",
  shopContent: "storefront-shop-content",
  categories: "storefront-categories",
  products: "storefront-products",
  legal: "storefront-legal",
  homepage: "storefront-homepage",
} as const

export type StorefrontCacheTag =
  (typeof STOREFRONT_CACHE_TAGS)[keyof typeof STOREFRONT_CACHE_TAGS]

export function revalidateStorefrontTags(...tags: StorefrontCacheTag[]) {
  for (const tag of tags) {
    revalidateTag(tag, "max")
  }
}

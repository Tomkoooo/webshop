import type { HomePageFeaturedProduct } from "@wse/sdk/templates/types"

/** Shape expected by `components/shop/ProductCard` (+ `hasVariants` helpers) built from homepage featured rows. */
export function homepageFeaturedToProductDetail(p: HomePageFeaturedProduct): Record<string, unknown> {
  return {
    _id: p.id,
    name: p.name,
    description: "",
    slug: p.slug,
    netPrice: p.netPrice,
    discount: p.discount,
    vatPercent: p.vatPercent,
    grossPrice: p.grossPrice,
    limitedPrice: p.limitedPrice,
    stock: p.stock,
    images: p.images,
    requireVariantSelection: p.requireVariantSelection,
    rating: p.rating,
    category: { name: p.category },
    variants: p.variants,
  }
}

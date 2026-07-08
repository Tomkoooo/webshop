import { resolveSiteContactChannels } from "@wse/core/lib/site-contact"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { ProductService } from "@wse/core/services/product"
import { FeedbackService } from "@wse/core/services/feedback"
import {
  getCachedShopContent,
  getCachedCategories,
  getCachedCategoryTree,
  getCachedFeatureFlag,
} from "@wse/core/lib/cached-storefront"
import { mediaImageSrc } from "@wse/core/lib/images"
import { listingPriceSummary } from "@wse/core/lib/pricing"
import { buildProductListingLines } from "@wse/core/lib/product-variants"
import {
  orderIdsByList,
  resolveFeaturedCategoryIds,
  resolveFeaturedProductIds,
} from "@wse/core/lib/featured-products"
import type { HomePageDeps, HomePageFeaturedProduct } from "@wse/sdk/templates/types"
import type { ShopContentSnapshot } from "@wse/core/lib/storefront-footer-data"
import type { CategoryTreeNode } from "@wse/core/lib/storefront-footer-data"

type ProductRating = { rating?: number }
type ProductVariant = {
  id: string
  attributes?: Record<string, string>
  netPrice?: number
  grossPrice?: number
  discount?: number
  stock?: number
  isActive?: boolean
  isDefault?: boolean
  images?: string[]
  limitedPrice?: ProductItem["limitedPrice"]
}
type ProductCategory = { name?: string }
type CategoryItem = {
  _id: { toString(): string }
  name: string
  seo?: { description?: string }
  image?: string
  slug: string
}
type ProductItem = {
  _id: { toString(): string }
  name: string
  slug: string
  variants?: ProductVariant[]
  ratings?: ProductRating[]
  requireVariantSelection?: boolean
  netPrice: number
  discount?: number
  grossPrice?: number
  limitedPrice?: {
    enabled?: boolean
    limitQuantity?: number
    netPrice?: number
    grossPrice?: number
    reservedCount?: number
    soldCount?: number
    claimedCount?: number
  }
  images?: string[]
  category?: ProductCategory
  stock?: number
  vatPercent?: number
}

export type HomepageRenderDependencies = Omit<HomePageDeps, "templateId">

export type HomepageDepsInternal = HomepageRenderDependencies & {
  shopContentSnapshot: ShopContentSnapshot
  categoryTreeSnapshot: CategoryTreeNode[]
}

function mapFeaturedProduct(p: ProductItem): HomePageFeaturedProduct {
  const allVariants = Array.isArray(p.variants) ? p.variants : []
  const effectiveVariants = allVariants.filter((v) => v.isActive !== false)
  const hasVariants = allVariants.length > 0
  const listingLines = buildProductListingLines({
    name: p.name,
    description: "",
    netPrice: p.netPrice,
    grossPrice: p.grossPrice,
    discount: p.discount,
    limitedPrice: p.limitedPrice,
    variants: effectiveVariants.map((v) => ({
      id: v.id,
      netPrice: v.netPrice ?? p.netPrice,
      grossPrice: v.grossPrice,
      discount: v.discount,
      isActive: v.isActive,
      limitedPrice: v.limitedPrice,
    })),
  })
  const { unitGross: gross } = listingPriceSummary(listingLines, p.vatPercent)
  const rootStock =
    typeof p.stock === "number" && Number.isFinite(p.stock) ? p.stock : 100

  return {
    hasVariants,
    rating:
      Array.isArray(p.ratings) && p.ratings.length > 0
        ? p.ratings.reduce((sum, rating) => sum + (rating.rating || 0), 0) / p.ratings.length
        : 0,
    id: p._id.toString(),
    name: p.name,
    slug: p.slug,
    requireVariantSelection: Boolean(p.requireVariantSelection),
    price: gross,
    image: mediaImageSrc(p.images?.[0]),
    category: p.category?.name || "Kategória",
    netPrice: p.netPrice,
    discount: Number(p.discount || 0) || 0,
    vatPercent: p.vatPercent,
    grossPrice: p.grossPrice,
    limitedPrice: p.limitedPrice,
    images: (p.images || []).map((img) => mediaImageSrc(img)),
    stock: rootStock,
    variants: allVariants.map((v) => ({
      id: v.id,
      netPrice: v.netPrice ?? p.netPrice,
      grossPrice: v.grossPrice,
      discount: v.discount,
      stock: v.stock,
      isActive: v.isActive,
      isDefault: v.isDefault,
      attributes: v.attributes,
      images: v.images?.map((img) => mediaImageSrc(img)),
      limitedPrice: v.limitedPrice,
    })),
  }
}

export type HomepageFeaturedResolveOptions = {
  cmsSelectedProductIds?: string[]
  maxItems?: number
}

export async function getHomepageRenderDependencies(
  options: HomepageFeaturedResolveOptions = {}
): Promise<HomepageDepsInternal> {
  const content = await getCachedShopContent()
  const channels = resolveSiteContactChannels(content)
  const company = {
    name: content.brand_name || "Company name",
    address: channels.address,
    phone: channels.phone,
    email: channels.primaryEmail,
    contactEmails: channels.emails,
  }

  if (!isShopEnabled()) {
    return {
      products: [],
      categories: [],
      reviews: [],
      shopEnabled: false,
      siteContact: channels,
      company,
      shopContentSnapshot: content,
      categoryTreeSnapshot: [],
    }
  }

  const [reviews, isShopPageEnabled, categoryTree, categoryData] = await Promise.all([
    FeedbackService.getHomepageReviews(6),
    getCachedFeatureFlag("shopPage", true),
    getCachedCategoryTree(),
    getCachedCategories(),
  ])

  let products: HomePageFeaturedProduct[] = []
  let categories: Array<{ id: string; name: string; description: string; image: string; slug: string }> = []

  if (isShopPageEnabled) {
    const featuredIds = await resolveFeaturedProductIds({
      cmsSelectedProductIds: options.cmsSelectedProductIds,
      maxItems: options.maxItems,
    })

    const categoryById = new Map(
      (categoryData as CategoryItem[]).map((c) => [c._id.toString(), c])
    )
    const featuredCategoryIds = await resolveFeaturedCategoryIds(4)
    categories = featuredCategoryIds
      .map((id) => categoryById.get(id))
      .filter((c): c is CategoryItem => Boolean(c))
      .map((c) => ({
        id: c._id.toString(),
        name: c.name,
        description: c.seo?.description || "Minőségi válogatás",
        image: mediaImageSrc(c.image),
        slug: c.slug,
      }))

    const productRows = await ProductService.getHomepageFeaturedByIds(featuredIds)
    const ordered = orderIdsByList(
      featuredIds,
      productRows.filter(Boolean) as ProductItem[]
    )
    products = ordered.map(mapFeaturedProduct)
  }

  return {
    products,
    categories,
    reviews,
    shopEnabled: isShopPageEnabled,
    siteContact: channels,
    company,
    shopContentSnapshot: content,
    categoryTreeSnapshot: categoryTree as CategoryTreeNode[],
  }
}

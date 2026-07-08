import { grossFromNetWithDiscount, clampVatPercent, customerGrossFromNetWithDiscount } from "@wse/core/lib/pricing"
import {
  getActiveVariants,
  getDefaultVariant,
  getVariantById,
  getVariantLabel,
  hasVariants,
  resolveProductView,
} from "@wse/core/lib/product-variants"
import { mediaImageSrc } from "@wse/core/lib/images"
import type { CheckoutSuggestionItemDto } from "@wse/core/services/checkout-product-suggestions"

export type CheckoutSuggestionVariantOption = NonNullable<CheckoutSuggestionItemDto["variants"]>[number]

type ProductLike = {
  _id?: { toString?: () => string } | string
  slug?: string
  name?: string
  description?: string
  vatPercent?: number
  stock?: number
  netPrice?: number
  grossPrice?: number
  discount?: number
  images?: string[]
  requireVariantSelection?: boolean
  variants?: Array<{
    id: string
    attributes?: Record<string, string>
    netPrice: number
    grossPrice?: number
    discount?: number
    stock?: number
    isActive?: boolean
    isDefault?: boolean
    images?: string[]
  }>
}

export function pickCheapestInStockVariantId(product: ProductLike): string | undefined {
  const active = getActiveVariants(product as Parameters<typeof getActiveVariants>[0]).filter(
    (v) => (Number(v.stock) || 0) > 0
  )
  if (active.length === 0) return undefined
  const pct = clampVatPercent(product.vatPercent)
  const sorted = [...active].sort(
    (a, b) =>
      grossFromNetWithDiscount(a.netPrice, a.discount || 0, pct) -
      grossFromNetWithDiscount(b.netPrice, b.discount || 0, pct)
  )
  return sorted[0]?.id
}

function variantToOption(product: ProductLike, variantId: string): CheckoutSuggestionVariantOption | null {
  const viewProduct = productForView(product)
  const variant = getVariantById(viewProduct, variantId)
  if (!variant) return null
  const view = resolveProductView(viewProduct, variantId)
  if (!view) return null
  const pct = clampVatPercent(product.vatPercent)
  return {
    variantId: variant.id,
    label: getVariantLabel(variant as Parameters<typeof getVariantLabel>[0]),
    attributes: variant.attributes || {},
    price: customerGrossFromNetWithDiscount(
      view.netPrice,
      view.discount,
      pct,
      view.grossPrice
    ),
    netPrice: view.netPrice,
    stock: view.stock,
    discount: view.discount,
    image: mediaImageSrc(view.images?.[0]),
  }
}

function lineIdFor(productId: string, variantId?: string): string {
  return variantId ? `${productId}:${variantId}` : productId
}

/** True when every in-stock variant line is already in the cart. */
export function allPurchasableVariantsInCart(
  product: ProductLike,
  productId: string,
  excludeLineIds: Set<string>
): boolean {
  const active = getActiveVariants(product as Parameters<typeof getActiveVariants>[0]).filter(
    (v) => (Number(v.stock) || 0) > 0
  )
  if (active.length === 0) {
    return excludeLineIds.has(lineIdFor(productId))
  }
  return active.every((v) => excludeLineIds.has(lineIdFor(productId, v.id)))
}

/**
 * Map a catalog product to a checkout suggestion row.
 * Includes in-stock variant options when the product has variants.
 */
function productForView(product: ProductLike): Parameters<typeof resolveProductView>[0] {
  return {
    name: product.name ?? "",
    description: product.description ?? "",
    images: product.images ?? [],
    netPrice: product.netPrice ?? 0,
    grossPrice: product.grossPrice,
    discount: product.discount,
    stock: product.stock,
    vatPercent: product.vatPercent,
    variants: product.variants,
    requireVariantSelection: product.requireVariantSelection,
  }
}

export function mapProductToCheckoutSuggestion(
  product: ProductLike,
  opts?: { forcedVariantId?: string | null }
): CheckoutSuggestionItemDto | null {
  const productId =
    typeof product._id === "string" ? product._id : product._id?.toString?.()
  if (!productId || !product.slug) return null

  const viewProduct = productForView(product)
  const pct = clampVatPercent(product.vatPercent)
  const active = getActiveVariants(viewProduct)
  const inStockVariants = active.filter((v) => (Number(v.stock) || 0) > 0)
  const displayStock =
    typeof (product as { __displayStock?: number }).__displayStock === "number"
      ? (product as { __displayStock: number }).__displayStock
      : null

  if (!hasVariants(viewProduct) || inStockVariants.length === 0) {
    const view = resolveProductView(viewProduct, null)
    const stock = view?.stock ?? displayStock ?? (Number(product.stock) || 0)
    if (!view || stock <= 0) return null
    return {
      id: productId,
      productId,
      name: view.name,
      slug: product.slug,
      price: customerGrossFromNetWithDiscount(view.netPrice, view.discount, pct, view.grossPrice),
      netPrice: view.netPrice,
      image: mediaImageSrc(view.images?.[0]),
      stock,
      discount: view.discount,
      vatPercent: pct,
      requiresVariantChoice: false,
    }
  }

  const optionCandidates =
    inStockVariants.length > 0 ? inStockVariants : displayStock && displayStock > 0 ? active : []
  const options = optionCandidates
    .map((v) => variantToOption(product, v.id))
    .filter((o): o is CheckoutSuggestionVariantOption => Boolean(o))

  if (options.length === 0) return null

  const requiresVariantChoice =
    Boolean(product.requireVariantSelection) || options.length > 1

  const defaultVariantId =
    opts?.forcedVariantId ??
    (getDefaultVariant(product as Parameters<typeof getDefaultVariant>[0])?.id &&
    inStockVariants.some((v) => v.id === getDefaultVariant(product as Parameters<typeof getDefaultVariant>[0])!.id)
      ? getDefaultVariant(product as Parameters<typeof getDefaultVariant>[0])!.id
      : undefined) ??
    pickCheapestInStockVariantId(product)

  const chosenId =
    defaultVariantId && options.some((o) => o.variantId === defaultVariantId)
      ? defaultVariantId
      : options[0]!.variantId

  const chosen = options.find((o) => o.variantId === chosenId)!

  if (!requiresVariantChoice) {
    const view = resolveProductView(viewProduct, chosenId)
    if (!view) return null
    return {
      id: lineIdFor(productId, chosenId),
      productId,
      variantId: chosenId,
      variantLabel: chosen.label,
      name: view.name,
      slug: product.slug,
      price: chosen.price,
      netPrice: chosen.netPrice,
      image: chosen.image,
      stock: chosen.stock,
      discount: chosen.discount,
      vatPercent: pct,
      requiresVariantChoice: false,
      variants: options,
    }
  }

  const view = resolveProductView(viewProduct, chosenId)
  if (!view) return null

  return {
    id: productId,
    productId,
    variantId: chosenId,
    variantLabel: chosen.label,
    name: view.name,
    slug: product.slug,
    price: chosen.price,
    netPrice: chosen.netPrice,
    image: chosen.image,
    stock: chosen.stock,
    discount: chosen.discount,
    vatPercent: pct,
    requiresVariantChoice: true,
    variants: options,
  }
}

export function resolveSuggestionLineId(
  item: CheckoutSuggestionItemDto,
  variantId?: string | null
): string {
  const vid = variantId || item.variantId
  if (item.requiresVariantChoice && item.variants?.length) {
    return vid ? lineIdFor(item.productId, vid) : item.productId
  }
  return item.id
}

export function suggestionLineInCart(
  item: CheckoutSuggestionItemDto,
  excludeLineIds: Set<string>,
  variantId?: string | null
): boolean {
  return excludeLineIds.has(resolveSuggestionLineId(item, variantId))
}

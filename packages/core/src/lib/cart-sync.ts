import { mediaImageSrc } from "@wse/core/lib/images"
import { customerGrossFromNetWithDiscount, clampVatPercent } from "@wse/core/lib/pricing"
import { cartLineSyncKey, parseCartLineIdentity } from "@wse/core/lib/cart-line-id"
import { getVariantById, getVariantLabel } from "@wse/core/lib/product-variants"
import { resolveProductView } from "@wse/core/lib/product-variants"
import type { CartItem } from "@wse/core/store/useCartStore"

export function cartLineProductId(item: { productId?: string; id: string }): string {
  return parseCartLineIdentity(item).productId
}

export function cartItemsSyncSignature(
  items: Array<{ productId?: string; id: string; variantId?: string; quantity: number }>
): string {
  return JSON.stringify(
    items
      .map((item) => {
        const { productId, variantId } = parseCartLineIdentity(item)
        return {
          key: cartLineSyncKey({ productId, variantId }),
          quantity: Math.max(1, Number(item.quantity) || 1),
        }
      })
      .sort((a, b) => a.key.localeCompare(b.key))
  )
}

export function areCartItemsSyncEqual(
  a: Array<{ productId?: string; id: string; variantId?: string; quantity: number }>,
  b: Array<{ productId?: string; id: string; variantId?: string; quantity: number }>
): boolean {
  return cartItemsSyncSignature(a) === cartItemsSyncSignature(b)
}

type DbCartProduct = {
  _id?: string | { toString(): string }
  name?: string
  slug?: string
  netPrice?: number
  grossPrice?: number
  discount?: number
  vatPercent?: number
  images?: string[]
  stock?: number
  isActive?: boolean
  isVisible?: boolean
  variants?: Array<{
    id: string
    isActive?: boolean
    stock?: number
    netPrice?: number
    grossPrice?: number
    discount?: number
    attributes?: Record<string, string>
  }>
  requireVariantSelection?: boolean
}

type DbCartLine = {
  product?: DbCartProduct | null
  quantity?: number
  variantId?: string
  variantLabel?: string
  selectedAttributes?: Record<string, string>
}

function productIdString(product: DbCartProduct | null | undefined): string | null {
  if (!product?._id) return null
  return typeof product._id === "string" ? product._id : product._id.toString()
}

function dbLineToCartItem(dbItem: DbCartLine): CartItem | null {
  const product = dbItem.product
  const productId = productIdString(product)
  if (!productId || !product?.name || !product.slug) return null
  if (product.isActive === false || product.isVisible === false) return null

  const variantId = dbItem.variantId?.trim() || undefined
  const view = resolveProductView(product as never, variantId)
  const qty = Math.max(1, Number(dbItem.quantity) || 1)
  const vatPct = clampVatPercent(product.vatPercent)
  const variant = variantId ? getVariantById(product as never, variantId) : null
  const variantLabel =
    dbItem.variantLabel?.trim() ||
    (variant ? getVariantLabel(variant) : undefined)
  const unitGross = customerGrossFromNetWithDiscount(
    view.netPrice,
    view.discount,
    vatPct,
    view.grossPrice
  )

  const lineId = variantId ? `${productId}:${variantId}` : productId

  return {
    id: lineId,
    productId,
    variantId,
    variantLabel,
    selectedAttributes: dbItem.selectedAttributes || variant?.attributes || {},
    name: view.name,
    slug: product.slug,
    price: unitGross,
    image: mediaImageSrc(view.images?.[0] || product.images?.[0]),
    quantity: qty,
    stock: Math.max(0, Number(view.stock) || 0),
    netPrice: view.netPrice,
    discount: view.discount,
    vatPercent: vatPct,
  }
}

/** Map populated Mongo cart lines to client cart items. */
export function dbCartItemsToCartItems(dbItems: DbCartLine[] | undefined): CartItem[] {
  if (!Array.isArray(dbItems)) return []

  const result: CartItem[] = []
  for (const dbItem of dbItems) {
    const line = dbLineToCartItem(dbItem)
    if (line) result.push(line)
  }
  return result
}

/** Prefer local lines; merge server lines by productId + variantId. */
export function mergeLocalAndServerCart(local: CartItem[], server: CartItem[]): CartItem[] {
  const merged: CartItem[] = []
  const seen = new Set<string>()

  for (const line of local) {
    const key = cartLineSyncKey({
      productId: cartLineProductId(line),
      variantId: line.variantId,
    })
    merged.push(line)
    seen.add(key)
  }

  for (const line of server) {
    const key = cartLineSyncKey({
      productId: line.productId,
      variantId: line.variantId,
    })
    if (seen.has(key)) continue
    merged.push(line)
    seen.add(key)
  }

  return merged
}

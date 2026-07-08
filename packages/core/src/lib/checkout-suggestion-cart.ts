import type { CartItem } from "@wse/core/store/useCartStore"
import type { CheckoutSuggestionItemDto } from "@wse/core/services/checkout-product-suggestions"

export function checkoutSuggestionToCartItem(
  item: CheckoutSuggestionItemDto,
  variantId?: string
): CartItem | null {
  const vid = variantId || item.variantId
  if (item.requiresVariantChoice && item.variants?.length && !vid) return null

  const variant = item.variants?.find((v) => v.variantId === vid)
  const lineId = vid ? `${item.productId}:${vid}` : item.productId

  return {
    id: lineId,
    productId: item.productId,
    variantId: vid,
    variantLabel: variant?.label ?? item.variantLabel,
    selectedAttributes: variant?.attributes ?? {},
    name: item.name,
    slug: item.slug,
    price: variant?.price ?? item.price,
    image: variant?.image ?? item.image,
    quantity: 1,
    stock: variant?.stock ?? item.stock,
    netPrice: variant?.netPrice ?? item.netPrice,
    discount: variant?.discount ?? item.discount,
    vatPercent: item.vatPercent,
  }
}

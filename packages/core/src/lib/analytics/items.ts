import type { CartItem } from "@wse/core/store/useCartStore"
import type { Ga4Item } from "./types"

export function cartItemToGa4Item(item: CartItem): Ga4Item {
  return {
    item_id: item.variantId ? `${item.productId}:${item.variantId}` : item.productId,
    item_name: item.name,
    price: item.price,
    quantity: item.quantity,
    ...(item.variantLabel ? { item_variant: item.variantLabel } : {}),
  }
}

export function cartItemsToGa4Items(items: CartItem[]): Ga4Item[] {
  return items.map(cartItemToGa4Item)
}

export function cartValue(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0)
}

export function ga4ItemFromProduct(params: {
  productId: string
  name: string
  price: number
  variantId?: string
  variantLabel?: string
  category?: string
  quantity?: number
}): Ga4Item {
  return {
    item_id: params.variantId ? `${params.productId}:${params.variantId}` : params.productId,
    item_name: params.name,
    price: params.price,
    quantity: params.quantity ?? 1,
    ...(params.variantLabel ? { item_variant: params.variantLabel } : {}),
    ...(params.category ? { item_category: params.category } : {}),
  }
}

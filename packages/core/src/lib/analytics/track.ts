import type { CartItem } from "@wse/core/store/useCartStore"
import { hasMarketingConsent } from "./consent"
import { pushDataLayer } from "./data-layer"
import { trackMeta } from "./meta"
import {
  cartItemToGa4Item,
  cartItemsToGa4Items,
  cartValue,
  ga4ItemFromProduct,
} from "./items"
import type {
  CheckoutAnalyticsSnapshot,
  Ga4Item,
  PageViewParams,
  SelectItemParams,
  ViewItemParams,
} from "./types"
import { ANALYTICS_CURRENCY as CURRENCY } from "./types"
import {
  clearCheckoutAnalyticsSnapshot,
  hasPurchaseFired,
  markPurchaseFired,
  readCheckoutAnalyticsSnapshot,
  saveCheckoutAnalyticsSnapshot,
} from "./checkout-snapshot"

function ecommercePayload(
  event: string,
  params: Record<string, unknown>
): Record<string, unknown> {
  return { event, ecommerce: params }
}

function metaContentFromItems(items: Ga4Item[], value?: number) {
  return {
    content_type: "product",
    content_ids: items.map((i) => i.item_id),
    contents: items.map((i) => ({
      id: i.item_id,
      quantity: i.quantity,
      item_price: i.price,
    })),
    currency: CURRENCY,
    value: value ?? items.reduce((s, i) => s + i.price * i.quantity, 0),
  }
}

export function trackPageView(params: PageViewParams): void {
  if (!hasMarketingConsent()) return
  pushDataLayer({
    event: "page_view",
    page_path: params.page_path,
    page_location: params.page_location ?? (typeof window !== "undefined" ? window.location.href : undefined),
    page_title: params.page_title ?? (typeof document !== "undefined" ? document.title : undefined),
  })
  trackMeta("PageView")
}

export function trackViewItemList(items: Ga4Item[], listName = "Shop"): void {
  if (!hasMarketingConsent() || items.length === 0) return
  const value = items.reduce((s, i) => s + i.price * i.quantity, 0)
  pushDataLayer(
    ecommercePayload("view_item_list", {
      item_list_name: listName,
      currency: CURRENCY,
      value,
      items,
    })
  )
  trackMeta("ViewContent", { ...metaContentFromItems(items, value), content_type: "product_group" })
}

export function trackViewItem(params: ViewItemParams): void {
  if (!hasMarketingConsent()) return
  const item = ga4ItemFromProduct({
    productId: params.item_id.split(":")[0] ?? params.item_id,
    name: params.item_name,
    price: params.price,
    variantId: params.item_id.includes(":") ? params.item_id.split(":")[1] : undefined,
    variantLabel: params.item_variant,
    category: params.item_category,
  })
  pushDataLayer(
    ecommercePayload("view_item", {
      currency: CURRENCY,
      value: params.price,
      items: [item],
    })
  )
  trackMeta("ViewContent", metaContentFromItems([item], params.price))
}

export function trackSelectItem(params: SelectItemParams): void {
  if (!hasMarketingConsent()) return
  const item = ga4ItemFromProduct({
    productId: params.item_id.split(":")[0] ?? params.item_id,
    name: params.item_name,
    price: params.price,
    variantId: params.item_id.includes(":") ? params.item_id.split(":")[1] : undefined,
    variantLabel: params.item_variant,
    category: params.item_category,
  })
  pushDataLayer(
    ecommercePayload("select_item", {
      item_list_name: params.item_list_name ?? "Shop",
      items: [item],
    })
  )
  trackMeta("ViewContent", metaContentFromItems([item], params.price))
}

export function trackAddToCart(item: CartItem, quantityAdded?: number): void {
  if (!hasMarketingConsent()) return
  const ga4Item = cartItemToGa4Item({
    ...item,
    quantity: quantityAdded ?? item.quantity,
  })
  const value = ga4Item.price * ga4Item.quantity
  pushDataLayer(
    ecommercePayload("add_to_cart", {
      currency: CURRENCY,
      value,
      items: [ga4Item],
    })
  )
  trackMeta("AddToCart", metaContentFromItems([ga4Item], value))
}

export function trackRemoveFromCart(item: CartItem): void {
  if (!hasMarketingConsent()) return
  const ga4Item = cartItemToGa4Item(item)
  const value = ga4Item.price * ga4Item.quantity
  pushDataLayer(
    ecommercePayload("remove_from_cart", {
      currency: CURRENCY,
      value,
      items: [ga4Item],
    })
  )
}

export function trackViewCart(items: CartItem[]): void {
  if (!hasMarketingConsent() || items.length === 0) return
  const ga4Items = cartItemsToGa4Items(items)
  const value = cartValue(items)
  pushDataLayer(
    ecommercePayload("view_cart", {
      currency: CURRENCY,
      value,
      items: ga4Items,
    })
  )
}

export function trackBeginCheckout(items: CartItem[]): void {
  if (!hasMarketingConsent() || items.length === 0) return
  const ga4Items = cartItemsToGa4Items(items)
  const value = cartValue(items)
  pushDataLayer(
    ecommercePayload("begin_checkout", {
      currency: CURRENCY,
      value,
      items: ga4Items,
    })
  )
  trackMeta("InitiateCheckout", metaContentFromItems(ga4Items, value))
}

export function saveCheckoutSnapshotFromCart(
  transactionId: string,
  items: CartItem[],
  extras?: { shipping?: number; tax?: number; coupon?: string; total?: number }
): void {
  saveCheckoutAnalyticsSnapshot({
    transactionId,
    value: extras?.total ?? cartValue(items),
    currency: CURRENCY,
    items: cartItemsToGa4Items(items),
    shipping: extras?.shipping,
    tax: extras?.tax,
    coupon: extras?.coupon,
  })
}

export function firePurchaseOnce(orderId: string | null): boolean {
  if (!hasMarketingConsent()) return false
  const id = orderId?.trim()
  if (!id) return false
  if (hasPurchaseFired(id)) return false

  const snapshot = readCheckoutAnalyticsSnapshot()
  if (!snapshot) return false

  const transactionId = id
  const value = snapshot.value
  const items = snapshot.items

  pushDataLayer(
    ecommercePayload("purchase", {
      transaction_id: transactionId,
      currency: snapshot.currency,
      value,
      shipping: snapshot.shipping,
      tax: snapshot.tax,
      coupon: snapshot.coupon,
      items,
    })
  )
  trackMeta("Purchase", {
    ...metaContentFromItems(items, value),
    order_id: transactionId,
  })

  markPurchaseFired(id)
  clearCheckoutAnalyticsSnapshot()
  return true
}

export type PressEventParams = {
  press_contact_id: string
  press_outlet: string
  press_name: string
  page_section?: string
  pdf_page?: number
}

/** Press portal events — may run without marketing cookie consent on /sajto routes. */
export function trackPressEvent(
  event: "press_portal_login" | "press_page_view" | "press_pdf_view",
  params: PressEventParams
): void {
  pushDataLayer(
    {
      event,
      press_contact_id: params.press_contact_id,
      press_outlet: params.press_outlet,
      press_name: params.press_name,
      ...(params.page_section ? { page_section: params.page_section } : {}),
      ...(params.pdf_page ? { pdf_page: params.pdf_page } : {}),
    },
    { skipConsentCheck: true }
  )
}

export type { CheckoutAnalyticsSnapshot, PageViewParams, SelectItemParams, ViewItemParams }

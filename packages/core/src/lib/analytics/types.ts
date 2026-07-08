export const ANALYTICS_CURRENCY = "HUF" as const

export type Ga4Item = {
  item_id: string
  item_name: string
  price: number
  quantity: number
  item_variant?: string
  item_category?: string
}

export type CheckoutAnalyticsSnapshot = {
  transactionId: string
  value: number
  currency: typeof ANALYTICS_CURRENCY
  items: Ga4Item[]
  shipping?: number
  tax?: number
  coupon?: string
}

export type PageViewParams = {
  page_path: string
  page_location?: string
  page_title?: string
}

export type ViewItemParams = {
  item_id: string
  item_name: string
  price: number
  item_variant?: string
  item_category?: string
}

export type SelectItemParams = ViewItemParams & {
  item_list_name?: string
}

"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { useCartStore } from "@wse/core/store/useCartStore"
import {
  trackBeginCheckout,
  trackPageView,
  trackViewCart,
  trackViewItemList,
} from "@wse/core/lib/analytics/track"
import { hasMarketingConsent } from "@wse/core/lib/analytics/consent"
import { ga4ItemFromProduct } from "@wse/core/lib/analytics/items"

function isAdminRoute(pathname: string): boolean {
  return pathname.startsWith("/admin")
}

export function AnalyticsRouteListener() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const items = useCartStore((s) => s.items)
  const itemsRef = React.useRef(items)
  const lastRouteRef = React.useRef<string | null>(null)

  React.useEffect(() => {
    itemsRef.current = items
  }, [items])

  const route = React.useMemo(() => {
    const query = searchParams.toString()
    return `${pathname || "/"}${query ? `?${query}` : ""}`
  }, [pathname, searchParams])

  React.useEffect(() => {
    if (!hasMarketingConsent()) return
    if (!pathname || isAdminRoute(pathname)) return
    if (lastRouteRef.current === route) return
    lastRouteRef.current = route

    trackPageView({
      page_path: route,
      page_title: typeof document !== "undefined" ? document.title : undefined,
    })

    if (pathname === "/cart") {
      trackViewCart(itemsRef.current)
    } else if (pathname === "/checkout") {
      trackBeginCheckout(itemsRef.current)
    }
  }, [route, pathname])

  return null
}

/** Fires view_item_list when shop listing products are provided. */
export function ShopListAnalytics({
  products,
}: {
  products: Array<{
    _id: { toString(): string }
    name: string
    slug: string
    netPrice: number
    grossPrice?: number
    vatPercent?: number
    category?: { name?: string }
  }>
}) {
  const firedRef = React.useRef(false)

  React.useEffect(() => {
    if (!hasMarketingConsent()) return
    if (firedRef.current || products.length === 0) return
    firedRef.current = true

    const items = products.slice(0, 50).map((p) =>
      ga4ItemFromProduct({
        productId: p._id.toString(),
        name: p.name,
        price: p.grossPrice ?? p.netPrice,
        category: p.category?.name,
      })
    )
    trackViewItemList(items, "Shop")
  }, [products])

  return null
}

"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { FALLBACK_TEMPLATE_ID, getTemplateById } from "@wse/core/templates/registry"
import type { FlowRouteKey } from "@wse/sdk/templates/types"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

const CartPageView = dynamic(
  () => import("@wse/core/components/flow-views/CartPageView").then((m) => ({ default: m.CartPageView })),
  { ssr: true }
)
const CheckoutPageView = dynamic(
  () => import("@wse/core/components/flow-views/CheckoutPageView").then((m) => ({ default: m.CheckoutPageView })),
  { ssr: true }
)
const ProfilePageView = dynamic(
  () => import("@wse/core/components/flow-views/ProfilePageView").then((m) => ({ default: m.ProfilePageView })),
  { ssr: true }
)

type Variant = "page" | "embedded"

/**
 * Resolves `template.flowPages[route].RouteMain` or falls back to the engine default page body.
 */
export function FlowRoutePageClient({
  templateId,
  flowRoute,
  variant = "page",
}: {
  templateId: string
  flowRoute: FlowRouteKey
  variant?: Variant
}) {
  const [shopEnabled, setShopEnabled] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch("/api/shop/availability")
        if (!res.ok) {
          if (!cancelled) setShopEnabled(false)
          return
        }
        const data = await res.json()
        if (!cancelled) setShopEnabled(Boolean(data.enabled))
      } catch {
        if (!cancelled) setShopEnabled(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const mod = getTemplateById(templateId) ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
  const RouteMain = mod.flowPages?.[flowRoute]?.RouteMain

  if (RouteMain && shopEnabled === null) {
    return variant === "embedded" ? (
      <div className="flex justify-center py-12" aria-busy="true">
        <LoadingSpinner />
      </div>
    ) : (
      <div className="flex min-h-[40vh] flex-col items-center justify-center py-16" aria-busy="true">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-sm text-muted-foreground">Betöltés…</p>
      </div>
    )
  }

  if (RouteMain && shopEnabled !== null) {
    return <RouteMain shopEnabled={shopEnabled} variant={variant} />
  }

  if (flowRoute === "cart") return <CartPageView variant={variant} />
  if (flowRoute === "checkout") return <CheckoutPageView variant={variant} />
  return <ProfilePageView variant={variant} />
}

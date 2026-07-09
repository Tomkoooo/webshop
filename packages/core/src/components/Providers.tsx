"use client"

import { lazy, Suspense, type ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { CartSync } from "./cart/CartSync"
import { AnalyticsProvider } from "./analytics/AnalyticsProvider"
import { CookieConsentBanner } from "./consent/CookieConsentBanner"
import { ChunkLoadRecovery } from "./ChunkLoadRecovery"
import { StorefrontPopupLayer } from "./storefront/StorefrontPopupLayer"
import type { PopupCampaign } from "@wse/core/lib/popup-campaign-schema"

const DevMetricsClient = lazy(() =>
  import("./dev/DevMetricsClient").then((module) => ({
    default: module.DevMetricsClient,
  }))
)

export function Providers({
  children,
  devMetricsEnabled = false,
  popupCampaigns = [],
  shopEnabled = true,
  adminChrome = false,
}: {
  children: ReactNode
  devMetricsEnabled?: boolean
  popupCampaigns?: PopupCampaign[]
  shopEnabled?: boolean
  /** Server-detected admin shell — skip storefront-only client work. */
  adminChrome?: boolean
}) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      <AnalyticsProvider>
        <ChunkLoadRecovery />
        {devMetricsEnabled ? (
          <Suspense fallback={null}>
            <DevMetricsClient enabled />
          </Suspense>
        ) : null}
        <CartSync shopEnabled={shopEnabled} />
        {children}
        {!adminChrome ? (
          <Suspense fallback={null}>
            <StorefrontPopupLayer campaigns={popupCampaigns} />
          </Suspense>
        ) : null}
        {!adminChrome ? <CookieConsentBanner /> : null}
      </AnalyticsProvider>
    </SessionProvider>
  )
}

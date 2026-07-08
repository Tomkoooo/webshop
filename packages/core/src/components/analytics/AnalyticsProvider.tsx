"use client"

import * as React from "react"
import { Suspense } from "react"
import { isAnalyticsEnabled } from "@wse/core/lib/analytics/config"
import { readConsent } from "@wse/core/lib/analytics/consent"
import { pushConsentDefaultDenied, pushConsentGranted } from "@wse/core/lib/analytics/data-layer"
import { AnalyticsScripts, resolveAnalyticsScriptIds } from "./AnalyticsScripts"
import { AnalyticsRouteListener } from "./AnalyticsRouteListener"
import { trackPageView } from "@wse/core/lib/analytics/track"

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const enabled = isAnalyticsEnabled()
  const scriptIds = resolveAnalyticsScriptIds()
  const [marketingConsent, setMarketingConsent] = React.useState(false)

  React.useEffect(() => {
    if (!enabled) return
    pushConsentDefaultDenied()
    const existing = readConsent()
    if (existing?.marketing) {
      pushConsentGranted()
      setMarketingConsent(true)
    }
  }, [enabled])

  React.useEffect(() => {
    if (!enabled) return
    const onConsentChange = (event: Event) => {
      const detail = (event as CustomEvent<{ marketing: boolean }>).detail
      if (detail?.marketing) {
        pushConsentGranted()
        setMarketingConsent(true)
        trackPageView({
          page_path: `${window.location.pathname}${window.location.search}`,
        })
      } else {
        setMarketingConsent(false)
      }
    }
    window.addEventListener("cookie-consent-changed", onConsentChange)
    return () => window.removeEventListener("cookie-consent-changed", onConsentChange)
  }, [enabled])

  const showMetaPixel =
    enabled && marketingConsent && scriptIds?.metaPixelId

  return (
    <>
      {showMetaPixel ? (
        <AnalyticsScripts metaPixelId={scriptIds.metaPixelId} />
      ) : null}
      {enabled && marketingConsent ? (
        <Suspense fallback={null}>
          <AnalyticsRouteListener />
        </Suspense>
      ) : null}
      {children}
    </>
  )
}

import Script from "next/script"
import { getGtmId, isAnalyticsEnabled } from "@wse/core/lib/analytics/config"

const CONSENT_DEFAULT_SCRIPT = `window.dataLayer=window.dataLayer||[];window.dataLayer.push({event:'consent_default',consent:{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',functionality_storage:'granted',security_storage:'granted'}});`

function gtmLoaderScript(gtmId: string): string {
  return `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`
}

/** GTM script in <head> — loads on every page when NEXT_PUBLIC_GTM_ID is set. */
export function GoogleTagManagerHead() {
  const gtmId = getGtmId()
  if (!gtmId || !isAnalyticsEnabled()) return null

  return (
    <>
      <Script
        id="gtm-consent-default"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: CONSENT_DEFAULT_SCRIPT }}
      />
      <Script
        id="gtm-loader"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: gtmLoaderScript(gtmId) }}
      />
    </>
  )
}

/** GTM noscript fallback — place immediately after opening <body>. */
export function GoogleTagManagerBodyNoscript() {
  const gtmId = getGtmId()
  if (!gtmId || !isAnalyticsEnabled()) return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  )
}

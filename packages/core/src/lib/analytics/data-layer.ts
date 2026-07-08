import { hasMarketingConsent } from "./consent"

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function ensureDataLayer(): Record<string, unknown>[] {
  if (typeof window === "undefined") return []
  window.dataLayer = window.dataLayer || []
  return window.dataLayer
}

export function pushDataLayer(
  payload: Record<string, unknown>,
  options?: { skipConsentCheck?: boolean }
): void {
  if (typeof window === "undefined") return
  if (!options?.skipConsentCheck && !hasMarketingConsent()) return
  ensureDataLayer().push(payload)
}

export function pushConsentDefaultDenied(): void {
  if (typeof window === "undefined") return
  ensureDataLayer().push({
    event: "consent_default",
    consent: {
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "granted",
      security_storage: "granted",
    },
  })
}

export function pushConsentGranted(): void {
  if (typeof window === "undefined") return
  ensureDataLayer().push({
    event: "consent_update",
    consent: {
      ad_storage: "granted",
      analytics_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "granted",
      functionality_storage: "granted",
      security_storage: "granted",
    },
  })
}

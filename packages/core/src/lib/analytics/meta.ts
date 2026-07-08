import { hasMarketingConsent } from "./consent"
import { getMetaPixelId } from "./config"

declare global {
  interface Window {
    fbq?: Fbq
    _fbq?: Fbq
  }
}

type Fbq = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[]
  loaded?: boolean
  version?: string
  push: Fbq
}

function getFbq(): Fbq | undefined {
  if (typeof window === "undefined") return undefined
  return window.fbq
}

export function isMetaPixelReady(): boolean {
  return Boolean(getFbq() && getMetaPixelId())
}

export function trackMeta(event: string, params?: Record<string, unknown>): void {
  if (!hasMarketingConsent()) return
  const fbq = getFbq()
  if (!fbq) return
  if (params) {
    fbq("track", event, params)
  } else {
    fbq("track", event)
  }
}

export function trackMetaCustom(event: string, params?: Record<string, unknown>): void {
  if (!hasMarketingConsent()) return
  const fbq = getFbq()
  if (!fbq) return
  if (params) {
    fbq("trackCustom", event, params)
  } else {
    fbq("trackCustom", event)
  }
}

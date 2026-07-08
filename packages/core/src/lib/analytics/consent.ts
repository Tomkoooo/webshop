export type ConsentState = {
  necessary: true
  marketing: boolean
  decidedAt: string
}

const STORAGE_KEY = "cookie-consent-v1"

export function readConsent(): ConsentState | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (parsed && typeof parsed.marketing === "boolean") return parsed
  } catch {
    /* ignore */
  }
  return null
}

export function writeConsent(marketing: boolean): ConsentState {
  const state: ConsentState = {
    necessary: true,
    marketing,
    decidedAt: new Date().toISOString(),
  }
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent("cookie-consent-changed", { detail: state }))
  }
  return state
}

export function hasMarketingConsent(): boolean {
  return readConsent()?.marketing === true
}

export function hasConsentDecision(): boolean {
  return readConsent() != null
}

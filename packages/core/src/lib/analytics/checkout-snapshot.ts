import type { CheckoutAnalyticsSnapshot } from "./types"

const SNAPSHOT_KEY = "analytics-checkout-snapshot"
const PURCHASED_PREFIX = "analytics-purchased-"

export function saveCheckoutAnalyticsSnapshot(snapshot: CheckoutAnalyticsSnapshot): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot))
  } catch {
    /* ignore */
  }
}

export function readCheckoutAnalyticsSnapshot(): CheckoutAnalyticsSnapshot | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CheckoutAnalyticsSnapshot
  } catch {
    return null
  }
}

export function clearCheckoutAnalyticsSnapshot(): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.removeItem(SNAPSHOT_KEY)
  } catch {
    /* ignore */
  }
}

export function markPurchaseFired(orderId: string): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(`${PURCHASED_PREFIX}${orderId}`, "1")
  } catch {
    /* ignore */
  }
}

export function hasPurchaseFired(orderId: string): boolean {
  if (typeof window === "undefined") return false
  try {
    return sessionStorage.getItem(`${PURCHASED_PREFIX}${orderId}`) === "1"
  } catch {
    return false
  }
}

export function updateSnapshotTransactionId(transactionId: string): void {
  const snapshot = readCheckoutAnalyticsSnapshot()
  if (!snapshot) return
  saveCheckoutAnalyticsSnapshot({ ...snapshot, transactionId })
}

"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { useCartStore } from "@wse/core/store/useCartStore"
import {
  cartItemsSyncSignature,
  dbCartItemsToCartItems,
  mergeLocalAndServerCart,
} from "@wse/core/lib/cart-sync"
import { reconcileCartItemsWithIssues, cartItemsNeedReconcile } from "@wse/core/lib/cart-reconcile"

const SAVE_DEBOUNCE_MS = 600

async function saveCartSnapshot(items: ReturnType<typeof useCartStore.getState>["items"]) {
  const response = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  })

  return response.ok
}

export function CartSync() {
  const { data: session, status } = useSession()
  const hasHydrated = useCartStore((s) => s._hasHydrated)
  const items = useCartStore((s) => s.items)
  const replaceItems = useCartStore((s) => s.replaceItems)

  const userId = session?.user?.id ?? null
  const initialSyncDoneRef = React.useRef<string | null>(null)
  const lastSavedSignatureRef = React.useRef<string | null>(null)
  const saveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    void useCartStore.persist.rehydrate()
  }, [])

  React.useEffect(() => {
    if (status !== "authenticated" || !userId || !hasHydrated) return
    if (initialSyncDoneRef.current === userId) return

    let cancelled = false

    const runInitialSync = async () => {
      const localItems = useCartStore.getState().items

      try {
        const response = await fetch("/api/cart", { method: "GET" })

        if (!response.ok || cancelled) return

        const dbCart = await response.json()
        const serverItems = dbCartItemsToCartItems(dbCart?.items)
        let merged = mergeLocalAndServerCart(localItems, serverItems)

        try {
          const validateRes = await fetch("/api/cart/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: merged.map((item) => ({
                id: item.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
                name: item.name,
                price: item.price,
              })),
            }),
          })
          if (validateRes.ok && !cancelled) {
            const { issues } = (await validateRes.json()) as { issues?: Record<string, string> }
            const reconciled = reconcileCartItemsWithIssues(merged, issues ?? {})
            if (cartItemsNeedReconcile(merged, reconciled)) {
              merged = reconciled
            }
          }
        } catch {
          /* validation optional on sync */
        }

        const mergedSignature = cartItemsSyncSignature(merged)
        const serverSignature = cartItemsSyncSignature(serverItems)

        lastSavedSignatureRef.current = mergedSignature
        replaceItems(merged)
        initialSyncDoneRef.current = userId

        if (mergedSignature !== serverSignature) {
          const saved = await saveCartSnapshot(merged)
          if (!cancelled && saved) {
            lastSavedSignatureRef.current = mergedSignature
          }
        }
      } catch (error) {
        console.error("Cart initial sync error:", error)
      }
    }

    void runInitialSync()

    return () => {
      cancelled = true
    }
  }, [status, userId, hasHydrated, replaceItems])

  React.useEffect(() => {
    if (status === "unauthenticated") {
      initialSyncDoneRef.current = null
      lastSavedSignatureRef.current = null
    }
  }, [status])

  React.useEffect(() => {
    if (status !== "authenticated" || !userId || !hasHydrated) return
    if (initialSyncDoneRef.current !== userId) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)

    const snapshot = useCartStore.getState().items
    const snapshotSignature = cartItemsSyncSignature(snapshot)
    if (lastSavedSignatureRef.current === snapshotSignature) return

    saveTimerRef.current = setTimeout(() => {
      const nextSnapshot = useCartStore.getState().items
      const nextSignature = cartItemsSyncSignature(nextSnapshot)
      if (lastSavedSignatureRef.current === nextSignature) return

      void saveCartSnapshot(nextSnapshot)
        .then((saved) => {
          if (saved) lastSavedSignatureRef.current = nextSignature
        })
        .catch((error) => {
          console.error("Cart save error:", error)
        })
    }, SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [items, status, userId, hasHydrated])

  return null
}

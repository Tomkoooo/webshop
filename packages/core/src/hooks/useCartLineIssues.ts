"use client"

import * as React from "react"
import type { CartItem } from "@wse/core/store/useCartStore"
import {
  cartItemsNeedReconcile,
  reconcileCartItemsWithIssues,
} from "@wse/core/lib/cart-reconcile"

function cartItemsSignature(items: CartItem[]): string {
  return items
    .map((item) => `${item.id}:${item.productId}:${item.variantId ?? ""}:${item.quantity}`)
    .join("|")
}

type Options = {
  reconcile?: boolean
  onReconciled?: (items: CartItem[]) => void
}

export function useCartLineIssues(items: CartItem[], options: Options = {}) {
  const { reconcile = false, onReconciled } = options
  const [issues, setIssues] = React.useState<Record<string, string>>({})
  const signature = cartItemsSignature(items)
  const onReconciledRef = React.useRef(onReconciled)
  onReconciledRef.current = onReconciled

  React.useEffect(() => {
    if (items.length === 0) {
      setIssues({})
      return
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: items.map((item) => ({
              id: item.id,
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              name: item.name,
              price: item.price,
            })),
          }),
        })
        if (!response.ok || cancelled) return
        const data = (await response.json()) as { issues?: Record<string, string> }
        const nextIssues = data.issues ?? {}
        if (!cancelled) setIssues(nextIssues)

        if (reconcile && !cancelled && onReconciledRef.current) {
          const reconciled = reconcileCartItemsWithIssues(items, nextIssues)
          if (cartItemsNeedReconcile(items, reconciled)) {
            onReconciledRef.current(reconciled)
          }
        }
      } catch {
        if (!cancelled) setIssues({})
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- signature encodes line ids/qty
  }, [signature, reconcile])

  const hasIssues = Object.keys(issues).length > 0
  return { issues, hasIssues }
}

"use client"

import { useCartStore } from "@wse/core/store/useCartStore"

/**
 * Template-facing façade over the engine cart (`useCartStore`).
 * Use from `commerceSlots` / chrome so templates depend on this stable hook instead of the store module.
 */
export function useTemplateCartActions() {
  const items = useCartStore((s) => s.items)
  const totalItems = useCartStore((s) => s.totalItems)
  const totalPrice = useCartStore((s) => s.totalPrice)
  const totalNetPrice = useCartStore((s) => s.totalNetPrice)
  const addItem = useCartStore((s) => s.addItem)
  const removeItem = useCartStore((s) => s.removeItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const clearCart = useCartStore((s) => s.clearCart)

  return {
    items,
    totalItems,
    totalPrice,
    totalNetPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
  }
}

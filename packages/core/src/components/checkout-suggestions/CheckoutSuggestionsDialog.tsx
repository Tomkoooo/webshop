"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@wse/core/store/useCartStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { Button } from "@wse/core/components/ui/button"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { formatHuf } from "@wse/core/lib/pricing"
import { cn } from "@wse/core/lib/utils"
import type { CheckoutSuggestionItemDto } from "@wse/core/services/checkout-product-suggestions"
import { shouldOpenCheckoutSuggestionsModal } from "@wse/core/lib/checkout-suggestions-modal"
import { checkoutSuggestionToCartItem } from "@wse/core/lib/checkout-suggestion-cart"
import { suggestionLineInCart } from "@wse/core/lib/checkout-suggestion-product"
import { CheckoutSuggestionProductRow } from "@wse/core/components/checkout-suggestions/CheckoutSuggestionProductRow"
import { LoadingSpinner } from "@wse/core/components/ui/LoadingSpinner"

/** Optional Tailwind (or arbitrary) classes for templates to restyle the checkout suggestions modal. */
export type CheckoutSuggestionsDialogPresentation = {
  contentClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  listClassName?: string
  itemClassName?: string
  footerClassName?: string
  primaryButtonClassName?: string
  secondaryButtonClassName?: string
}

export type CheckoutSuggestionsCartLine = {
  id: string
  name: string
  variantLabel?: string
  quantity: number
  price: number
  image: string
}

export type CheckoutSuggestionsDialogProps = {
  open: boolean
  /** Sync open state; when transitioning to closed, parent clears payload and navigates to checkout. */
  onDialogOpenChange: (open: boolean) => void
  loading: boolean
  items: CheckoutSuggestionItemDto[]
  cartLines?: CheckoutSuggestionsCartLine[]
  modalTitle?: string
  modalHelper?: string
  selectedIds: Set<string>
  variantByProductId: Record<string, string>
  onToggle: (itemId: string) => void
  onVariantChange: (productId: string, variantId: string) => void
  onAddSelectedAndCheckout: () => void
  cartLineIds: Set<string>
  presentation?: CheckoutSuggestionsDialogPresentation
}

export function CheckoutSuggestionsDialog({
  open,
  loading,
  items,
  cartLines = [],
  modalTitle,
  modalHelper,
  selectedIds,
  variantByProductId,
  onToggle,
  onVariantChange,
  onDialogOpenChange,
  onAddSelectedAndCheckout,
  cartLineIds,
  presentation,
}: CheckoutSuggestionsDialogProps) {
  const p = presentation ?? {}
  return (
    <Dialog open={open} onOpenChange={onDialogOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] max-w-2xl flex-col overflow-hidden border-border bg-background text-foreground sm:max-w-2xl",
          p.contentClassName
        )}
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className={cn("text-foreground", p.titleClassName)}>
            {modalTitle?.trim() || "Még valami a kosárba?"}
          </DialogTitle>
          {modalHelper?.trim() ? (
            <DialogDescription className={cn("text-muted-foreground", p.descriptionClassName)}>
              {modalHelper}
            </DialogDescription>
          ) : (
            <DialogDescription className={cn("text-muted-foreground", p.descriptionClassName)}>
              Válassz javasolt termékeket, vagy lépj tovább a pénztárba.
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex flex-1 items-center justify-center py-12" aria-busy="true">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-6">
            {cartLines.length > 0 ? (
              <div className="shrink-0 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Kosár tartalma
                </p>
                <ul className={cn("space-y-3", p.listClassName)}>
                  {cartLines.map((line) => (
                    <li
                      key={line.id}
                      className={cn(
                        "flex items-center gap-4 border border-border p-3 bg-muted/20",
                        p.itemClassName
                      )}
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border bg-muted">
                        <FallbackImage
                          src={line.image}
                          alt=""
                          width={64}
                          height={64}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-heading font-black text-sm uppercase leading-tight text-foreground">
                          {line.name}
                        </p>
                        {line.variantLabel ? (
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary-foreground">
                            {line.variantLabel}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm font-black text-muted-foreground">
                          {line.quantity} × {formatHuf(line.price)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {items.length > 0 ? (
              <div className="flex min-h-0 flex-1 flex-col gap-3">
                <p className="shrink-0 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Javasolt termékek
                </p>
                <ul
                  className={cn(
                    "min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1",
                    p.listClassName
                  )}
                >
            {items.map((it) => {
              const chosenVariantId = variantByProductId[it.productId] ?? it.variantId
              const inCart = suggestionLineInCart(it, cartLineIds, chosenVariantId)
              return (
                <CheckoutSuggestionProductRow
                  key={it.productId}
                  item={{ ...it, alreadyInCart: inCart }}
                  selected={selectedIds.has(it.id)}
                  chosenVariantId={chosenVariantId}
                  onToggle={() => onToggle(it.id)}
                  onVariantChange={(variantId) => onVariantChange(it.productId, variantId)}
                  className={p.itemClassName}
                />
              )
            })}
                </ul>
              </div>
            ) : cartLines.length === 0 ? (
              <p className="shrink-0 text-sm text-muted-foreground">
                Jelenleg nincs megjeleníthető javasolt termék (látható készlettel / variánssal).
              </p>
            ) : null}
          </div>
        )}

        <DialogFooter className={cn("shrink-0 gap-2 sm:justify-between sm:gap-4", p.footerClassName)}>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "rounded-none border-border font-black uppercase tracking-widest text-[10px]",
              p.secondaryButtonClassName
            )}
            onClick={() => onDialogOpenChange(false)}
          >
            Nem, tovább a pénztár
          </Button>
          <Button
            type="button"
            className={cn(
              "rounded-none bg-primary font-black uppercase tracking-widest text-[10px] text-primary-foreground",
              p.primaryButtonClassName
            )}
            disabled={loading}
            onClick={onAddSelectedAndCheckout}
          >
            Kosárba és pénztár
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type UseCheckoutWithSuggestionsOptions = {
  /** Pass Tailwind classes to match your template’s cart / typography (Atelier uses serif + rounded). */
  dialogPresentation?: CheckoutSuggestionsDialogPresentation
}

export function useCheckoutWithSuggestions(options: UseCheckoutWithSuggestionsOptions = {}) {
  const { dialogPresentation } = options
  const router = useRouter()
  const cartItems = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)

  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [payload, setPayload] = React.useState<{
    items: CheckoutSuggestionItemDto[]
    showCartLinesInModal?: boolean
    modalTitle?: string
    modalHelper?: string
  } | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [variantByProductId, setVariantByProductId] = React.useState<Record<string, string>>({})
  const cartLineIds = React.useMemo(() => new Set(cartItems.map((i) => i.id)), [cartItems])

  const navigateCheckoutOnly = React.useCallback(() => {
    router.push("/checkout")
  }, [router])

  const handleDialogOpenChange = React.useCallback(
    (next: boolean) => {
      setOpen(next)
      if (!next) {
        setPayload(null)
        setSelectedIds(new Set())
        setVariantByProductId({})
        router.push("/checkout")
      }
    },
    [router]
  )

  const beginCheckout = React.useCallback(async () => {
    setLoading(true)
    try {
      const excludeProductIds = cartItems.map((i) => i.productId)
      const excludeLineIds = cartItems.map((i) => i.id)
      const res = await fetch("/api/shop/product-suggestions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ excludeProductIds, excludeLineIds }),
      })
      if (!res.ok) {
        navigateCheckoutOnly()
        return
      }
      const data = (await res.json()) as {
        enabled?: boolean
        showCartLinesInModal?: boolean
        items: CheckoutSuggestionItemDto[]
        modalTitle?: string
        modalHelper?: string
      }
      const showCart = Boolean(data.showCartLinesInModal) && cartItems.length > 0
      const hasSuggestions = Boolean(data.items?.length)
      if (
        !shouldOpenCheckoutSuggestionsModal({
          enabled: Boolean(data.enabled),
          suggestionCount: data.items?.length ?? 0,
          showCartLinesInModal: Boolean(data.showCartLinesInModal),
          cartLineCount: cartItems.length,
        })
      ) {
        navigateCheckoutOnly()
        return
      }
      setPayload({
        items: data.items ?? [],
        showCartLinesInModal: showCart,
        modalTitle: data.modalTitle,
        modalHelper: data.modalHelper,
      })
      const initialVariants: Record<string, string> = {}
      for (const i of data.items ?? []) {
        if (i.variantId) initialVariants[i.productId] = i.variantId
      }
      setVariantByProductId(initialVariants)
      setSelectedIds(new Set())
      setOpen(true)
    } catch {
      navigateCheckoutOnly()
    } finally {
      setLoading(false)
    }
  }, [cartItems, cartLineIds, navigateCheckoutOnly])

  const onVariantChange = React.useCallback((productId: string, variantId: string) => {
    setVariantByProductId((prev) => ({ ...prev, [productId]: variantId }))
  }, [])

  const toggle = React.useCallback((lineId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(lineId)) next.delete(lineId)
      else next.add(lineId)
      return next
    })
  }, [])

  const onAddSelectedAndCheckout = React.useCallback(() => {
    if (!payload) {
      navigateCheckoutOnly()
      return
    }
    for (const it of payload.items) {
      if (!selectedIds.has(it.id)) continue
      const vid = variantByProductId[it.productId] ?? it.variantId
      if (suggestionLineInCart(it, cartLineIds, vid)) continue
      const cartItem = checkoutSuggestionToCartItem(it, vid)
      if (cartItem) addItem(cartItem)
    }
    handleDialogOpenChange(false)
  }, [
    payload,
    selectedIds,
    variantByProductId,
    cartLineIds,
    addItem,
    handleDialogOpenChange,
    navigateCheckoutOnly,
  ])

  const checkoutModalUI = React.useMemo(
    () => (
      <CheckoutSuggestionsDialog
        open={open}
        onDialogOpenChange={handleDialogOpenChange}
        loading={loading}
        items={payload?.items ?? []}
        cartLines={
          payload?.showCartLinesInModal
            ? cartItems.map((line) => ({
                id: line.id,
                name: line.name,
                variantLabel: line.variantLabel,
                quantity: line.quantity,
                price: line.price,
                image: line.image,
              }))
            : []
        }
        modalTitle={payload?.modalTitle}
        modalHelper={payload?.modalHelper}
        selectedIds={selectedIds}
        variantByProductId={variantByProductId}
        onToggle={toggle}
        onVariantChange={onVariantChange}
        onAddSelectedAndCheckout={onAddSelectedAndCheckout}
        cartLineIds={cartLineIds}
        presentation={dialogPresentation}
      />
    ),
    [
      open,
      loading,
      payload,
      cartItems,
      selectedIds,
      variantByProductId,
      cartLineIds,
      toggle,
      onVariantChange,
      handleDialogOpenChange,
      onAddSelectedAndCheckout,
      dialogPresentation,
    ]
  )

  return { beginCheckout, checkoutModalUI, checkoutSuggestionsLoading: loading }
}

/**
 * Template-facing control: renders a button (slot for label) and the checkout-suggestions modal.
 * Custom `flowPages.cart.RouteMain` implementations should use this instead of linking straight to `/checkout`.
 */
export function CheckoutSuggestionsGate({
  className,
  disabled,
  children,
  dialogPresentation,
}: {
  className?: string
  disabled?: boolean
  children: React.ReactNode
  dialogPresentation?: CheckoutSuggestionsDialogPresentation
}) {
  const { beginCheckout, checkoutModalUI, checkoutSuggestionsLoading } = useCheckoutWithSuggestions({
    dialogPresentation,
  })
  return (
    <>
      <Button
        type="button"
        className={className}
        disabled={disabled || checkoutSuggestionsLoading}
        onClick={() => void beginCheckout()}
      >
        {children}
      </Button>
      {checkoutModalUI}
    </>
  )
}

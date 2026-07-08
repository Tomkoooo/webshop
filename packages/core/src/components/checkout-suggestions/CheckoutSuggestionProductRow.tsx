"use client"

import * as React from "react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { formatHuf } from "@wse/core/lib/pricing"
import { cn } from "@wse/core/lib/utils"
import type { CheckoutSuggestionItemDto } from "@wse/core/services/checkout-product-suggestions"

type Props = {
  item: CheckoutSuggestionItemDto
  selected: boolean
  chosenVariantId: string | undefined
  onToggle: () => void
  onVariantChange: (variantId: string) => void
  className?: string
}

export function CheckoutSuggestionProductRow({
  item,
  selected,
  chosenVariantId,
  onToggle,
  onVariantChange,
  className,
}: Props) {
  const variants = item.variants ?? []
  const showPicker = Boolean(item.requiresVariantChoice && variants.length > 0)
  const activeVariantId = chosenVariantId || item.variantId
  const activeVariant = variants.find((v) => v.variantId === activeVariantId)
  const displayPrice = activeVariant?.price ?? item.price
  const displayImage = activeVariant?.image || item.image
  const displayLabel = activeVariant?.label ?? item.variantLabel
  const outOfStock = (activeVariant?.stock ?? item.stock) <= 0
  const disabled = Boolean(item.alreadyInCart) || (showPicker && !activeVariantId) || outOfStock

  return (
    <li
      className={cn(
        "flex flex-col gap-3 border border-border p-3 transition-colors sm:flex-row sm:items-start",
        selected && !item.alreadyInCart ? "border-primary-foreground/50 bg-muted/30" : "opacity-90",
        item.alreadyInCart && "border-muted bg-muted/20 opacity-100",
        className
      )}
    >
      <div className="flex items-start gap-4">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
          checked={item.alreadyInCart ? false : selected}
          disabled={disabled}
          onChange={() => {
            if (item.alreadyInCart || disabled) return
            onToggle()
          }}
          aria-label={`${item.name} kijelölése`}
        />
        <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-border bg-muted">
          <FallbackImage
            src={displayImage}
            alt=""
            width={64}
            height={64}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-black uppercase leading-tight text-foreground">{item.name}</p>
          {displayLabel ? (
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{displayLabel}</p>
          ) : null}
          <p className="mt-1 text-sm font-black text-foreground">{formatHuf(displayPrice)}</p>
          {item.alreadyInCart ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground">Ez a variáns már a kosárban van.</p>
          ) : showPicker && !activeVariantId ? (
            <p className="mt-1 text-xs font-medium text-amber-600">Válassz variánst a kosárba helyezéshez.</p>
          ) : null}
        </div>
      </div>

      {showPicker && !item.alreadyInCart ? (
        <div className="w-full sm:pl-28">
          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Variáns</p>
          <div className="flex flex-wrap gap-1.5">
            {variants.map((v) => {
              const isActive = activeVariantId === v.variantId
              return (
                <button
                  key={v.variantId}
                  type="button"
                  onClick={() => onVariantChange(v.variantId)}
                  className={cn(
                    "rounded-none border px-2.5 py-1.5 text-left text-[10px] font-bold uppercase tracking-wide transition-colors",
                    isActive
                      ? "border-primary-foreground/35 bg-primary text-primary-foreground"
                      : "border-border text-foreground hover:border-primary-foreground/40"
                  )}
                >
                  <span className="block leading-tight">{v.label}</span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[9px] font-black",
                      isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                    )}
                  >
                    {formatHuf(v.price)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </li>
  )
}

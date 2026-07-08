"use client"

import * as React from "react"
import { cn } from "@wse/core/lib/utils"
import {
  getActiveVariants,
  getVariantAttributes,
  getVariantByAttributes,
  getVariantLabel,
  getVariantOptionGroups,
  isVariantAttributeValueAvailable,
} from "@wse/core/lib/product-variants"

export function QuickVariantSelector({
  product,
  selectedVariantId,
  onVariantChange,
  className,
  chipClassName,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product: any
  selectedVariantId: string
  onVariantChange: (variantId: string) => void
  className?: string
  chipClassName?: string
}) {
  const groups = getVariantOptionGroups(product)
  const [selectedAttributes, setSelectedAttributes] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    if (selectedVariantId) setSelectedAttributes(getVariantAttributes(product, selectedVariantId))
  }, [product, selectedVariantId])

  if (groups.length === 0) {
    return (
      <div className={cn("flex flex-wrap gap-1.5", className)}>
        {getActiveVariants(product).map((variant) => (
          <button
            key={variant.id}
            type="button"
            onClick={() => onVariantChange(variant.id)}
            className={cn(
              "min-h-8 border px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-colors",
              selectedVariantId === variant.id
                ? "border-primary-foreground/40 bg-primary/15 text-primary-foreground"
                : "border-border text-muted-foreground hover:border-primary-foreground/40 hover:text-foreground",
              chipClassName
            )}
          >
            {getVariantLabel(variant as never)}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {groups.map((group) => (
        <div key={group.name} className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            {group.name}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.values.map((value) => {
              const isSelected = selectedAttributes[group.name] === value
              const isAvailable = isVariantAttributeValueAvailable(product, selectedAttributes, group.name, value)
              return (
                <button
                  key={`${group.name}-${value}`}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    const next = { ...selectedAttributes, [group.name]: value }
                    setSelectedAttributes(next)
                    onVariantChange(getVariantByAttributes(product, next)?.id || "")
                  }}
                  className={cn(
                    "min-h-8 border px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-colors disabled:cursor-not-allowed disabled:opacity-35",
                    isSelected
                      ? "border-primary-foreground/40 bg-primary/15 text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-primary-foreground/40 hover:text-foreground",
                    chipClassName
                  )}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

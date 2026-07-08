"use client"

import { createElement, useEffect, useState } from "react"
import { resolveCommerceProductDetailForId } from "@wse/core/templates/resolve-commerce-slots"
import type { ProductDetailSlotProps } from "@wse/sdk/templates/types"

type Props = ProductDetailSlotProps & { templateId: string }

/** Renders `commerceSlots.ProductDetail` when defined, else the engine default PDP body. */
export function ResolvedTemplateProductDetail({ templateId, ...slotProps }: Props) {
  const [Cmp, setCmp] = useState<React.ComponentType<ProductDetailSlotProps> | null>(null)

  useEffect(() => {
    let cancelled = false
    void resolveCommerceProductDetailForId(templateId).then((Resolved) => {
      if (!cancelled) setCmp(() => Resolved)
    })
    return () => {
      cancelled = true
    }
  }, [templateId])

  if (!Cmp) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Termék betöltése…
      </div>
    )
  }

  return createElement(Cmp, slotProps)
}

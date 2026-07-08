"use client"

import { ProductDetail } from "@wse/core/components/shop/ProductDetail"
import type { ProductDetailSlotProps } from "@wse/sdk/templates/types"

/**
 * Atelier PDP: same data contract as the engine component, with **buy column first** on desktop
 * so the layout reads differently from the default gallery-left pattern.
 */
export function AtelierProductDetailSlot({
  product,
  initialVariantId,
  shopEnabled,
  editorial,
  introPlacement,
}: ProductDetailSlotProps) {
  return (
    <div className="border-x border-b border-accent/25 bg-muted/15 px-2 pb-12 pt-6 sm:px-6">
      <ProductDetail
        product={product as never}
        initialVariantId={initialVariantId}
        shopEnabled={shopEnabled}
        editorial={editorial}
        introPlacement={introPlacement}
        buyColumnFirst
      />
    </div>
  )
}

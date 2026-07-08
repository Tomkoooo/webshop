import { isNumberedVariantId } from "@wse/core/lib/numbered-variant-ranges"
import type { AdminVariantRow } from "@wse/core/lib/admin-product-variants"
import type { UniqueNumberedVariantsLike } from "@wse/core/lib/unique-numbered-variants"

export const DEFAULT_BASE_VARIANT_ID = "base"

export function resolveBaseVariantId(
  config?: UniqueNumberedVariantsLike | null
): string {
  const id = String(config?.baseVariantId || DEFAULT_BASE_VARIANT_ID).trim()
  return id || DEFAULT_BASE_VARIANT_ID
}

export function buildBaseVariantRow(options: {
  defaultNetPrice: number
  defaultGrossPrice?: number
  stock?: number
  nameOverride?: string
  id?: string
}): AdminVariantRow {
  const id = options.id?.trim() || DEFAULT_BASE_VARIANT_ID
  return {
    id,
    attributes: {},
    nameOverride: options.nameOverride?.trim() || "Általános példány (nem sorszámozott)",
    netPrice: options.defaultNetPrice,
    grossPrice: options.defaultGrossPrice,
    discount: 0,
    stock: Math.max(0, Number(options.stock ?? 0) || 0),
    isActive: true,
    isDefault: false,
    limitedPrice: {
      enabled: false,
      limitQuantity: 0,
      reservedCount: 0,
      soldCount: 0,
      claimedCount: 0,
    },
    seo: { title: "", description: "", keywords: [] },
  }
}

export function hasBaseVariant(
  variants: Array<{ id: string }>,
  config?: UniqueNumberedVariantsLike | null
): boolean {
  const baseId = resolveBaseVariantId(config)
  return variants.some((v) => v.id === baseId || !isNumberedVariantId(v.id))
}

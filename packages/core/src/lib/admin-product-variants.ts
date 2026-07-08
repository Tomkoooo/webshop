import { netToGross } from "@wse/core/lib/pricing"

export type AdminVariantRow = {
  id: string
  attributes: Record<string, string>
  sku?: string
  nameOverride?: string
  descriptionOverride?: string
  netPrice: number
  grossPrice?: number
  discount: number
  stock: number
  isActive: boolean
  isDefault: boolean
  limitedPrice?: {
    enabled: boolean
    limitQuantity: number
    netPrice?: number
    grossPrice?: number
    reservedCount?: number
    soldCount?: number
    claimedCount?: number
  }
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

export type AdminVariantInput = Partial<AdminVariantRow>

/** Treat 0 / missing variant price as “inherit product default”. */
export function resolveVariantNetPrice(
  variantNet: number | undefined | null,
  defaultNetPrice: number
): number {
  const n = Number(variantNet)
  if (Number.isFinite(n) && n > 0) return n
  return Number(defaultNetPrice) || 0
}

export function resolveVariantGrossPrice(
  variant: Pick<AdminVariantRow, "netPrice" | "grossPrice">,
  vatPercent: number,
  defaultGrossPrice?: number
): number {
  const gross = Number(variant.grossPrice)
  if (Number.isFinite(gross) && gross > 0) return gross
  const net = Number(variant.netPrice)
  if (Number.isFinite(net) && net > 0) return netToGross(net, vatPercent)
  if (defaultGrossPrice != null && defaultGrossPrice > 0) return defaultGrossPrice
  return 0
}

export function hasVariantPriceOverride(
  variant: Pick<AdminVariantRow, "netPrice" | "grossPrice">,
  defaultNetPrice?: number
): boolean {
  const gross = Number(variant.grossPrice)
  if (Number.isFinite(gross) && gross > 0) return true

  const net = Number(variant.netPrice)
  if (!Number.isFinite(net) || net <= 0) return false

  return defaultNetPrice == null || net !== Number(defaultNetPrice)
}

/** Plain variant rows for admin client components (no Mongoose subdocument `_id`). */
export function normalizeAdminVariants(
  variants: AdminVariantInput[],
  defaultNetPrice: number
): AdminVariantRow[] {
  return variants.map((variant, index) => {
    const netPrice = resolveVariantNetPrice(variant.netPrice, defaultNetPrice)
    const grossRaw = Number(variant.grossPrice)
    const grossPrice = Number.isFinite(grossRaw) && grossRaw > 0 ? grossRaw : undefined
    return {
      id: String(variant.id || `variant-${index + 1}`),
      attributes:
        variant.attributes && typeof variant.attributes === "object"
          ? { ...variant.attributes }
          : {},
      sku: variant.sku ? String(variant.sku) : undefined,
      nameOverride: variant.nameOverride ? String(variant.nameOverride) : undefined,
      descriptionOverride: variant.descriptionOverride
        ? String(variant.descriptionOverride)
        : undefined,
      netPrice,
      grossPrice,
      discount: Number(variant.discount ?? 0) || 0,
      stock: Number(variant.stock ?? 0) || 0,
      isActive: variant.isActive !== false,
      isDefault: Boolean(variant.isDefault),
      limitedPrice: {
        enabled: Boolean(variant.limitedPrice?.enabled),
        limitQuantity: Number(variant.limitedPrice?.limitQuantity ?? 0) || 0,
        netPrice:
          Number.isFinite(Number(variant.limitedPrice?.netPrice)) && Number(variant.limitedPrice?.netPrice) > 0
            ? Number(variant.limitedPrice?.netPrice)
            : undefined,
        grossPrice:
          Number.isFinite(Number(variant.limitedPrice?.grossPrice)) && Number(variant.limitedPrice?.grossPrice) > 0
            ? Number(variant.limitedPrice?.grossPrice)
            : undefined,
        reservedCount: Number(variant.limitedPrice?.reservedCount ?? 0) || 0,
        soldCount: Number(variant.limitedPrice?.soldCount ?? 0) || 0,
        claimedCount:
          Number(variant.limitedPrice?.claimedCount ?? 0) ||
          (Number(variant.limitedPrice?.reservedCount ?? 0) || 0) +
            (Number(variant.limitedPrice?.soldCount ?? 0) || 0),
      },
      seo: {
        title: variant.seo?.title || "",
        description: variant.seo?.description || "",
        keywords: variant.seo?.keywords || [],
      },
    }
  })
}

export function variantGrossForDisplay(
  variant: AdminVariantRow,
  vatPercent: number,
  defaultGrossPrice?: number,
  defaultNetPrice?: number
): number {
  if (!hasVariantPriceOverride(variant, defaultNetPrice)) {
    if (defaultGrossPrice != null && defaultGrossPrice > 0) return defaultGrossPrice
    return netToGross(Number(defaultNetPrice) || 0, vatPercent)
  }
  return resolveVariantGrossPrice(variant, vatPercent, defaultGrossPrice)
}

export function deriveVariantGrossBounds(
  variants: AdminVariantRow[],
  vatPercent: number,
  defaultGrossPrice?: number,
  defaultNetPrice?: number
) {
  const grosses = variants
    .filter((v) => v.isActive !== false)
    .map((v) => variantGrossForDisplay(v, vatPercent, defaultGrossPrice, defaultNetPrice))
    .filter((g) => g > 0)
  if (grosses.length === 0) return { min: 0, max: 0 }
  return { min: Math.min(...grosses), max: Math.max(...grosses) }
}

export function deriveProductLevelFromVariants(variants: AdminVariantRow[]) {
  if (!variants.length) {
    return { netPrice: 0, grossPrice: 0, stock: 0, discount: 0 }
  }
  const defaultVariant = variants.find((v) => v.isDefault) || variants[0]
  const gross = Number(defaultVariant.grossPrice)
  return {
    netPrice: Number(defaultVariant.netPrice) || 0,
    grossPrice: Number.isFinite(gross) && gross > 0 ? gross : 0,
    stock: variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0),
    discount: Math.max(0, ...variants.map((v) => Number(v.discount) || 0)),
  }
}

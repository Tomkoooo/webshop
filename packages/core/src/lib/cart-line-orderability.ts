import { maxQuantityForCartLine, productRequiresVariantPurchase } from "@wse/core/lib/unique-numbered-variants"
import { isStorefrontProductOrderable } from "@wse/core/lib/storefront-catalog"

export type CartLineForOrderability = {
  productId: string
  variantId?: string
  quantity: number
  name?: string
}

export type ProductForCartOrderability = {
  name: string
  isActive?: boolean
  isVisible?: boolean
  stock?: number
  requireVariantSelection?: boolean
  uniqueNumberedVariants?: { enabled?: boolean; maxQuantityPerLine?: number }
  variants?: Array<{
    id: string
    isActive?: boolean
    stock?: number
  }>
}

/** Human-readable reason when a cart line cannot be ordered (null = OK). */
export function getCartLineOrderabilityMessage(
  line: CartLineForOrderability,
  product: ProductForCartOrderability | null | undefined
): string | null {
  const label = line.name?.trim() || product?.name?.trim() || "A termék"

  if (!product) {
    return "A termék már nem található."
  }

  if (product.isVisible === false) {
    return `${label} már nem elérhető a boltban.`
  }
  if (!isStorefrontProductOrderable(product)) {
    return `${label} jelenleg nem vásárolható (előnézet / teszt mód).`
  }

  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0
  const requireVariantSelection = productRequiresVariantPurchase(product)

  if (line.variantId) {
    if (!hasVariants) {
      return `Érvénytelen variáns: ${label}.`
    }
    const variant = product.variants!.find((entry) => entry.id === line.variantId)
    if (!variant) {
      return `A kiválasztott variáns már nem elérhető: ${label}.`
    }
    if (variant.isActive === false) {
      return `A kiválasztott variáns már nem elérhető: ${label}.`
    }
    const stock = Math.max(0, Number(variant.stock) || 0)
    const cap = maxQuantityForCartLine(product, stock, line.variantId)
    if (cap <= 0) {
      return `${label} jelenleg nincs raktáron.`
    }
    if (line.quantity > cap) {
      return `Csak ${cap} db rendelhető (kosárban: ${line.quantity}).`
    }
    return null
  }

  if (requireVariantSelection) {
    return `Válassz variánst a termékhez: ${label}.`
  }

  const stock = Math.max(0, Number(product.stock) || 0)
  const cap = maxQuantityForCartLine(product, stock)
  if (cap <= 0) {
    return `${label} jelenleg nincs raktáron.`
  }
  if (line.quantity > cap) {
    return `Csak ${cap} db rendelhető (kosárban: ${line.quantity}).`
  }

  return null
}

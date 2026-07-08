import {
  getActiveVariants,
  getVariantOptionGroups,
  hasVariants,
  type ProductShape,
} from "@wse/core/lib/product-variants";
import {
  getBaseVariant,
  hasInStockNumberedVariants,
  isUniqueNumberedProduct,
} from "@wse/core/lib/unique-numbered-variants";

/** Max variant chips / option values shown on listing product cards. */
export const CARD_VARIANT_PICKER_MAX_CHIPS = 24;

export function shouldUseCompactVariantPickerOnCard(
  product: ProductShape & {
    uniqueNumberedVariants?: { enabled?: boolean } | null;
  }
): boolean {
  if (isUniqueNumberedProduct(product)) {
    return hasInStockNumberedVariants(product);
  }
  if (!hasVariants(product)) return false;

  const active = getActiveVariants(product);
  if (active.length > CARD_VARIANT_PICKER_MAX_CHIPS) return true;

  return getVariantOptionGroups(product).some(
    (group) => group.values.length > CARD_VARIANT_PICKER_MAX_CHIPS
  );
}

export function countInStockVariants(product: ProductShape): number {
  return getActiveVariants(product).filter((v) => (Number(v.stock) || 0) > 0).length;
}

export function countInStockNumberedVariants(
  product: ProductShape & { uniqueNumberedVariants?: { enabled?: boolean } | null }
): number {
  if (!isUniqueNumberedProduct(product)) return countInStockVariants(product);
  return getActiveVariants(product).filter(
    (v) => v.id.startsWith("num-") && (Number(v.stock) || 0) > 0
  ).length;
}

export function initialCardVariantId(
  product: ProductShape & { uniqueNumberedVariants?: { enabled?: boolean } | null }
): string {
  if (isUniqueNumberedProduct(product)) {
    if (hasInStockNumberedVariants(product)) return "";
    const base = getBaseVariant(product);
    if (base && (Number(base.stock) || 0) > 0) return base.id;
    return "";
  }
  if (shouldUseCompactVariantPickerOnCard(product)) return "";
  const active = getActiveVariants(product);
  return active.find((v) => v.isDefault)?.id || active[0]?.id || "";
}

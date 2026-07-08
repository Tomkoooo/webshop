type SeoShape = {
  title?: string;
  description?: string;
  keywords?: string[];
};

export type VariantShape = {
  id: string;
  attributes?: Record<string, string>;
  nameOverride?: string;
  descriptionOverride?: string;
  netPrice: number;
  grossPrice?: number;
  discount?: number;
  stock?: number;
  isActive?: boolean;
  isDefault?: boolean;
  images?: string[];
  limitedPrice?: LimitedPriceShape;
  seo?: SeoShape;
};

type LimitedPriceShape = {
  enabled?: boolean;
  limitQuantity?: number;
  netPrice?: number;
  grossPrice?: number;
  reservedCount?: number;
  soldCount?: number;
  claimedCount?: number;
};

type VariantOptionShape = {
  name: string;
  values: string[];
};

export type ProductShape = {
  name: string;
  description?: string;
  images?: string[];
  netPrice: number;
  grossPrice?: number;
  discount?: number;
  stock?: number;
  limitedPrice?: LimitedPriceShape;
  vatPercent?: number;
  seo?: SeoShape;
  variantOptions?: VariantOptionShape[];
  variants?: VariantShape[];
  requireVariantSelection?: boolean;
  uniqueNumberedVariants?: {
    enabled?: boolean;
    attributeName?: string;
    maxQuantityPerLine?: number;
    descriptionHtml?: string;
    baseVariantId?: string;
    numberRanges?: Array<{ from: number; to: number; exclude?: number[] }>;
  } | null;
};

import {
  clampVatPercent,
  customerGrossFromNetWithDiscount,
  customerUnitGross,
  priceBreakdownFromGross,
} from "@wse/core/lib/pricing";
import { resolveVariantDescription } from "@wse/core/lib/unique-numbered-variants";

export function hasVariants(product: ProductShape): boolean {
  return Array.isArray(product.variants) && product.variants.length > 0;
}

export function getActiveVariants(product: ProductShape): VariantShape[] {
  if (!hasVariants(product)) return [];
  return (product.variants || []).filter((variant) => variant.isActive !== false);
}

export function hasPurchasableActiveVariants(product: ProductShape): boolean {
  return getActiveVariants(product).some((variant) => (Number(variant.stock) || 0) > 0);
}

export function getVariantById(product: ProductShape, variantId?: string | null): VariantShape | null {
  if (!variantId || !hasVariants(product)) return null;
  const variants = getActiveVariants(product);
  return variants.find((variant) => variant.id === variantId) || null;
}

export function getDefaultVariant(product: ProductShape): VariantShape | null {
  if (!hasVariants(product)) return null;
  const variants = getActiveVariants(product);
  if (variants.length === 0) return null;
  return variants.find((variant) => variant.isDefault) || variants[0];
}

export function getVariantLabel(variant: VariantShape): string {
  const attrs = variant.attributes || {};
  const parts = Object.entries(attrs)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => `${key}: ${value}`);
  return parts.join(" / ") || variant.id;
}

export function getVariantOptionGroups(product: ProductShape): VariantOptionShape[] {
  const activeVariants = getActiveVariants(product);
  const configured = Array.isArray(product.variantOptions) ? product.variantOptions : [];
  const configuredGroups = configured
    .map((option) => {
      const name = String(option.name || "").trim();
      const values = Array.isArray(option.values)
        ? option.values
            .map((value) => String(value || "").trim())
            .filter(
              (value) =>
                Boolean(value) &&
                activeVariants.some(
                  (variant) => String(variant.attributes?.[name] || "").trim() === value
                )
            )
        : [];
      return { name, values };
    })
    .filter((option) => option.name && option.values.length > 0);
  if (configuredGroups.length > 0) return configuredGroups;

  const byName = new Map<string, Set<string>>();
  for (const variant of getActiveVariants(product)) {
    for (const [name, value] of Object.entries(variant.attributes || {})) {
      if (!name || !value) continue;
      if (!byName.has(name)) byName.set(name, new Set<string>());
      byName.get(name)!.add(value);
    }
  }
  return Array.from(byName.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
}

export function getVariantAttributes(product: ProductShape, variantId?: string | null): Record<string, string> {
  return { ...(getVariantById(product, variantId)?.attributes || {}) };
}

export function getVariantByAttributes(
  product: ProductShape,
  selectedAttributes: Record<string, string>
): VariantShape | null {
  const groups = getVariantOptionGroups(product);
  const requiredNames = groups.map((group) => group.name);
  if (requiredNames.some((name) => !selectedAttributes[name])) return null;

  return (
    getActiveVariants(product).find((variant) =>
      requiredNames.every((name) => variant.attributes?.[name] === selectedAttributes[name])
    ) || null
  );
}

export function isVariantAttributeValueAvailable(
  product: ProductShape,
  selectedAttributes: Record<string, string>,
  optionName: string,
  value: string
): boolean {
  const candidate = { ...selectedAttributes, [optionName]: value };
  return getActiveVariants(product).some((variant) =>
    Object.entries(candidate).every(([name, selected]) => !selected || variant.attributes?.[name] === selected)
  );
}

function resolveLimitedPriceLine<T extends { netPrice: number; grossPrice?: number; limitedPrice?: LimitedPriceShape }>(
  source: T
) {
  const limited = source.limitedPrice;
  if (!limited?.enabled) return null;
  const limit = Math.max(0, Math.round(Number(limited.limitQuantity || 0)));
  const claimed = Math.max(0, Math.round(Number(limited.claimedCount || 0)));
  if (limit <= 0 || claimed >= limit) return null;
  const netPrice = Number(limited.netPrice || 0);
  const grossPrice = Number(limited.grossPrice || 0);
  if (netPrice <= 0 && grossPrice <= 0) return null;
  return {
    netPrice: netPrice > 0 ? netPrice : source.netPrice,
    grossPrice: grossPrice > 0 ? grossPrice : undefined,
    discount: 0,
  };
}

export function getLimitedPriceOffer(product: ProductShape, variantId?: string | null) {
  const variant = variantId ? getVariantById(product, variantId) : null;
  if (variantId && !variant) return null;
  const source = variant || product;
  const limited = source.limitedPrice;
  if (!limited?.enabled) return null;

  const limitQuantity = Math.max(0, Math.round(Number(limited.limitQuantity || 0)));
  const claimedCount = Math.max(0, Math.round(Number(limited.claimedCount || 0)));
  const remainingQuantity = Math.max(0, limitQuantity - claimedCount);
  const promoNet = Number(limited.netPrice || 0);
  const promoGross = Number(limited.grossPrice || 0);
  if (limitQuantity <= 0 || (promoNet <= 0 && promoGross <= 0)) return null;

  const vatPercent = clampVatPercent(product.vatPercent);
  const regularNet = Number(source.netPrice || product.netPrice || 0);
  const regularGross = customerGrossFromNetWithDiscount(
    regularNet,
    Number(source.discount || product.discount || 0),
    vatPercent,
    source.grossPrice || product.grossPrice
  );
  const promoUnitGross =
    promoGross > 0
      ? customerUnitGross(promoNet, vatPercent, promoGross)
      : customerUnitGross(promoNet, vatPercent);
  const promoBreakdown = priceBreakdownFromGross(promoUnitGross, 1, vatPercent);
  const regularBreakdown = priceBreakdownFromGross(regularGross, 1, vatPercent);

  return {
    enabled: true,
    limitQuantity,
    claimedCount,
    remainingQuantity,
    promoUnitGross,
    promoUnitNet: promoBreakdown.unitNet,
    promoUnitVat: promoBreakdown.unitVat,
    regularUnitGross: regularGross,
    regularUnitNet: regularBreakdown.unitNet,
    regularUnitVat: regularBreakdown.unitVat,
    vatPercent,
    exhausted: remainingQuantity <= 0,
  };
}

export function buildProductListingLines(product: ProductShape) {
  const activeVariants = getActiveVariants(product)
  if (activeVariants.length > 0) {
    return activeVariants.map((variant) => {
      const limitedLine = resolveLimitedPriceLine(variant);
      return limitedLine || {
        netPrice: Number(variant.netPrice ?? product.netPrice) || product.netPrice,
        discount: variant.discount,
        grossPrice: variant.grossPrice,
      };
    })
  }
  const productLimitedLine = resolveLimitedPriceLine(product);
  if (productLimitedLine) return [productLimitedLine];
  return [
    {
      netPrice: product.netPrice,
      discount: product.discount,
      grossPrice: product.grossPrice,
    },
  ]
}

export function buildRegularProductListingLines(product: ProductShape) {
  const activeVariants = getActiveVariants(product)
  if (activeVariants.length > 0) {
    return activeVariants.map((variant) => ({
      netPrice: Number(variant.netPrice ?? product.netPrice) || product.netPrice,
      discount: variant.discount,
      grossPrice: variant.grossPrice,
    }))
  }
  return [
    {
      netPrice: product.netPrice,
      discount: product.discount,
      grossPrice: product.grossPrice,
    },
  ]
}

export function resolveProductView(product: ProductShape, variantId?: string | null) {
  const selectedVariant = getVariantById(product, variantId);
  const activeVariants = getActiveVariants(product);
  const variantMinNetPrice =
    activeVariants.length > 0
      ? Math.min(...activeVariants.map((variant) => variant.netPrice || product.netPrice))
      : product.netPrice;
  const variantMinDiscount =
    activeVariants.length > 0
      ? Math.max(...activeVariants.map((variant) => variant.discount || 0))
      : product.discount || 0;

  const limitedLine = resolveLimitedPriceLine(selectedVariant || product);
  const netPrice = limitedLine?.netPrice ?? selectedVariant?.netPrice ?? product.netPrice;
  const grossPrice = limitedLine?.grossPrice ?? selectedVariant?.grossPrice ?? product.grossPrice;
  const discount = limitedLine ? 0 : selectedVariant?.discount ?? product.discount ?? 0;
  const stock = selectedVariant?.stock ?? product.stock ?? 0;
  const name = selectedVariant?.nameOverride || product.name;
  const description = resolveVariantDescription(product, selectedVariant, variantId);
  const images = selectedVariant?.images?.length ? selectedVariant.images : product.images || [];
  const variantKeywords = selectedVariant?.seo?.keywords || [];
  const productKeywords = product.seo?.keywords || [];
  const seo = {
    title: selectedVariant?.seo?.title || product.seo?.title || name,
    description: selectedVariant?.seo?.description || product.seo?.description || description.slice(0, 160),
    keywords: variantKeywords.length > 0 ? variantKeywords : productKeywords,
  };

  return {
    selectedVariant,
    hasVariantSelection: hasVariants(product),
    requiresVariantSelection: Boolean(product.requireVariantSelection) && hasVariants(product),
    hasValidSelection: Boolean(selectedVariant),
    name,
    description,
    images,
    netPrice,
    grossPrice,
    discount,
    stock,
    seo,
    minNetPrice: variantMinNetPrice,
    maxDiscount: variantMinDiscount,
  };
}

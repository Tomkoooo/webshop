import {
  isNumberedVariantId,
  issueNumberFromVariantId,
  type NumberRange,
} from "@wse/core/lib/numbered-variant-ranges";
import { DEFAULT_BASE_VARIANT_ID, resolveBaseVariantId } from "@wse/core/lib/numbered-variant-base";

type VariantLine = {
  id: string;
  isActive?: boolean;
  stock?: number;
  attributes?: Record<string, string>;
  nameOverride?: string;
  descriptionOverride?: string;
};

export type ProductWithVariants = {
  variants?: VariantLine[];
  uniqueNumberedVariants?: UniqueNumberedVariantsLike | null;
};

function activeVariantLines(product: ProductWithVariants): VariantLine[] {
  if (!Array.isArray(product.variants)) return [];
  return product.variants.filter((variant) => variant.isActive !== false);
}

export type UniqueNumberedVariantsConfig = {
  enabled: boolean;
  attributeName: string;
  maxQuantityPerLine: number;
  descriptionHtml?: string;
  /** Non-numbered fallback variant id (default `base`). Shown when all numbered copies are sold. */
  baseVariantId?: string;
  /** Tartományok a PDP szűrő chipjeihez (ugyanaz a JSON, mint a generátornál). */
  numberRanges?: NumberRange[];
};

export const DEFAULT_UNIQUE_NUMBERED_CONFIG: UniqueNumberedVariantsConfig = {
  enabled: false,
  attributeName: "Szám",
  maxQuantityPerLine: 1,
};

export function normalizeUniqueNumberedVariants(
  input?: Partial<UniqueNumberedVariantsConfig> | null
): UniqueNumberedVariantsConfig | undefined {
  if (!input?.enabled) return undefined;
  const attributeName = String(input.attributeName || "Szám").trim() || "Szám";
  const maxQuantityPerLine = Math.max(1, Math.round(Number(input.maxQuantityPerLine ?? 1) || 1));
  const descriptionHtml = String(input.descriptionHtml ?? "").trim() || undefined;
  const baseVariantId = String(input.baseVariantId ?? DEFAULT_BASE_VARIANT_ID).trim() || DEFAULT_BASE_VARIANT_ID;
  const numberRanges = normalizeStoredNumberRanges(input.numberRanges);
  return {
    enabled: true,
    attributeName,
    maxQuantityPerLine,
    descriptionHtml,
    baseVariantId,
    ...(numberRanges.length > 0 ? { numberRanges } : {}),
  };
}

function normalizeStoredNumberRanges(raw: unknown): NumberRange[] {
  if (!Array.isArray(raw)) return [];
  const ranges: NumberRange[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const from = Math.round(Number(row.from));
    const to = Math.round(Number(row.to));
    if (!Number.isFinite(from) || !Number.isFinite(to)) continue;
    const exclude = Array.isArray(row.exclude)
      ? row.exclude.map((n) => Math.round(Number(n))).filter((n) => Number.isFinite(n))
      : undefined;
    ranges.push({ from: Math.min(from, to), to: Math.max(from, to), ...(exclude?.length ? { exclude } : {}) });
  }
  return ranges;
}

/** Replace {{number}}, {{szam}}, {{Szám}} etc. with the selected issue number. */
export function applyNumberedDescriptionTemplate(
  template: string,
  attributes: Record<string, string> | undefined,
  attributeName = "Szám"
): string {
  const number =
    attributes?.[attributeName]?.trim() ||
    Object.values(attributes || {}).find((v) => /^\d+$/.test(String(v).trim()))?.trim() ||
    "";
  const attrKey = attributeName.trim() || "Szám";
  return template
    .replace(/\{\{\s*number\s*\}\}/gi, number)
    .replace(/\{\{\s*szam\s*\}\}/gi, number)
    .replace(new RegExp(`\\{\\{\\s*${attrKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\}\\}`, "gi"), number);
}

function variantAttributesForDescription(
  variant: { id?: string; attributes?: Record<string, string> },
  attributeName: string
): Record<string, string> {
  const attrs = { ...(variant.attributes || {}) };
  const name = attributeName.trim() || "Szám";
  if (!String(attrs[name] || "").trim() && variant.id) {
    const fromId = issueNumberFromVariantId(variant.id);
    if (fromId != null) attrs[name] = String(fromId);
  }
  return attrs;
}

export function resolveVariantDescription(
  product: {
    description?: string;
    uniqueNumberedVariants?: UniqueNumberedVariantsLike | null;
  },
  variant?: {
    id?: string;
    descriptionOverride?: string;
    attributes?: Record<string, string>;
  } | null,
  selectedVariantId?: string | null
): string {
  const fallback = product.description || "";
  const variantId = variant?.id ?? selectedVariantId ?? "";
  if (!variant && !variantId) return fallback;

  const perVariant = String(variant?.descriptionOverride || "").trim();
  if (perVariant) return perVariant;

  if (isBaseVariantId(variantId, product.uniqueNumberedVariants)) {
    return fallback;
  }

  const numbered = product.uniqueNumberedVariants;
  if (numbered?.enabled && variant) {
    const template = String(numbered.descriptionHtml || "").trim();
    if (template) {
      return applyNumberedDescriptionTemplate(
        template,
        variantAttributesForDescription(variant, numbered.attributeName || "Szám"),
        numbered.attributeName
      );
    }
  }

  return fallback;
}

export type UniqueNumberedVariantsLike = {
  enabled?: boolean;
  attributeName?: string;
  maxQuantityPerLine?: number;
  descriptionHtml?: string;
  baseVariantId?: string;
  numberRanges?: NumberRange[];
};

export function isUniqueNumberedProduct(
  product?: { uniqueNumberedVariants?: UniqueNumberedVariantsLike | null } | null
): boolean {
  return Boolean(product?.uniqueNumberedVariants?.enabled);
}

export function getNumberedVariants(product: ProductWithVariants) {
  return activeVariantLines(product).filter((variant) => isNumberedVariantId(variant.id));
}

/** Fallback SKU when all issue numbers are sold (non-`num-*` variant, usually id `base`). */
export function getBaseVariant(product: ProductWithVariants) {
  const active = activeVariantLines(product);
  const baseId = resolveBaseVariantId(product.uniqueNumberedVariants);
  const explicit = active.find((variant) => variant.id === baseId);
  if (explicit) return explicit;
  return active.find((variant) => !isNumberedVariantId(variant.id)) || null;
}

export function isBaseVariantId(
  variantId: string | undefined | null,
  config?: UniqueNumberedVariantsLike | null
): boolean {
  if (!variantId) return false;
  if (variantId === resolveBaseVariantId(config)) return true;
  if (config?.enabled) return false;
  return !isNumberedVariantId(variantId);
}

export function hasInStockNumberedVariants(product: ProductWithVariants): boolean {
  return getNumberedVariants(product).some((variant) => (Number(variant.stock) || 0) > 0);
}

export function isBaseVariantInStock(product: ProductWithVariants): boolean {
  const base = getBaseVariant(product);
  return Boolean(base && (Number(base.stock) || 0) > 0);
}

/** Numbered issue picker — only while at least one numbered copy is in stock. */
export function shouldShowNumberedVariantPicker(product: ProductWithVariants): boolean {
  return isUniqueNumberedProduct(product) && hasInStockNumberedVariants(product);
}

/** Customer must choose a variant (numbered issue and/or base) before add-to-cart. */
export function productRequiresVariantPurchase(product: {
  requireVariantSelection?: boolean
  uniqueNumberedVariants?: UniqueNumberedVariantsLike | null
  variants?: Array<{ id?: string; isActive?: boolean; stock?: number }>
}): boolean {
  if (isUniqueNumberedProduct(product)) {
    const numbered = product as ProductWithVariants
    return hasInStockNumberedVariants(numbered) || isBaseVariantInStock(numbered);
  }
  const hasAnyVariants = Array.isArray(product.variants) && product.variants.length > 0
  return Boolean(product.requireVariantSelection) && hasAnyVariants
}

export function maxQuantityForCartLine(
  product: { uniqueNumberedVariants?: UniqueNumberedVariantsLike | null; stock?: number },
  variantStock?: number,
  variantId?: string
): number {
  const numberedLine =
    isUniqueNumberedProduct(product) &&
    variantId &&
    isNumberedVariantId(variantId) &&
    !isBaseVariantId(variantId, product.uniqueNumberedVariants);
  const cap = numberedLine
    ? Math.max(1, product.uniqueNumberedVariants?.maxQuantityPerLine ?? 1)
    : Number.POSITIVE_INFINITY;
  const stockCap = Number.isFinite(variantStock)
    ? Math.max(0, Number(variantStock))
    : Math.max(0, Number(product.stock) || 0);
  if (!Number.isFinite(cap)) return stockCap;
  return Math.min(cap, stockCap);
}

/** Apply shared HTML template to each numbered variant's `descriptionOverride` (supports {{number}}). */
export function applyNumberedDescriptionOverrides<T extends VariantLine & { descriptionOverride?: string }>(
  variants: T[],
  template: string,
  attributeName = "Szám"
): T[] {
  const trimmed = template.trim();
  return variants.map((variant) => {
    if (!isNumberedVariantId(variant.id)) return variant;
    if (!trimmed) {
      return { ...variant, descriptionOverride: "" };
    }
    return {
      ...variant,
      descriptionOverride: applyNumberedDescriptionTemplate(
        trimmed,
        variant.attributes,
        attributeName
      ),
    };
  });
}

export function extractIssueNumberFromLine(
  selectedAttributes?: Record<string, string> | null,
  variantLabel?: string | null,
  attributeName = "Szám"
): string {
  const fromAttrs = selectedAttributes?.[attributeName]?.trim();
  if (fromAttrs) return fromAttrs;
  const label = String(variantLabel || "").trim();
  const match = label.match(new RegExp(`${attributeName}\\s*:\\s*([^/|]+)`, "i"));
  return match?.[1]?.trim() || "";
}

import { clampVatPercent, customerGrossFromNetWithDiscount, customerUnitGross } from "@wse/core/lib/pricing";

export type LimitedPriceCounter = "reserved" | "sold";

export type LimitedPriceRecord = {
  enabled?: boolean;
  limitQuantity?: number;
  netPrice?: number;
  grossPrice?: number;
  claimedCount?: number;
};

export type CheckoutLinePriceQuote = {
  promoQuantity: number;
  regularQuantity: number;
  promoUnitPrice?: number;
  regularUnitPrice: number;
  lineTotal: number;
  vatPercent: number;
};

function roundCurrency(value: number): number {
  return Math.round(value);
}

export function getLimitedPromoRemaining(limited?: LimitedPriceRecord | null): number {
  if (!limited?.enabled) return 0;
  const limit = Math.max(0, Math.round(Number(limited.limitQuantity || 0)));
  const claimed = Math.max(0, Math.round(Number(limited.claimedCount || 0)));
  return Math.max(0, limit - claimed);
}

export function resolveRegularUnitPrice(
  product: { vatPercent?: number },
  source: { netPrice?: number; grossPrice?: number; discount?: number }
): { unitPrice: number; vatPercent: number } {
  const pct = clampVatPercent(product.vatPercent ?? 27);
  return {
    unitPrice: customerGrossFromNetWithDiscount(
      Number(source.netPrice || 0),
      Number(source.discount || 0),
      pct,
      source.grossPrice
    ),
    vatPercent: pct,
  };
}

export function resolvePromoUnitPrice(
  product: { vatPercent?: number },
  limited?: LimitedPriceRecord | null
): { unitPrice: number; vatPercent: number } | null {
  const remaining = getLimitedPromoRemaining(limited);
  const promoNet = Number(limited?.netPrice || 0);
  const promoGross = Number(limited?.grossPrice || 0);
  if (remaining <= 0 || (promoNet <= 0 && promoGross <= 0)) return null;

  const pct = clampVatPercent(product.vatPercent ?? 27);
  return {
    unitPrice:
      promoGross > 0
        ? customerUnitGross(promoNet, pct, promoGross)
        : customerUnitGross(promoNet, pct),
    vatPercent: pct,
  };
}

function resolveLimitedSource(
  product: {
    limitedPrice?: LimitedPriceRecord;
    variants?: Array<{ id: string; limitedPrice?: LimitedPriceRecord; isActive?: boolean }>;
  },
  variantId?: string
): LimitedPriceRecord | null {
  if (variantId) {
    const variant = (product.variants || []).find((entry) => entry.id === variantId);
    return variant?.limitedPrice ?? null;
  }
  return product.limitedPrice ?? null;
}

/** Read-only quote of how a checkout line should be priced before stock is reserved. */
export function quoteCheckoutLineForQuantity(
  product: {
    vatPercent?: number;
    netPrice?: number;
    grossPrice?: number;
    discount?: number;
    limitedPrice?: LimitedPriceRecord;
    variants?: Array<{
      id: string;
      netPrice?: number;
      grossPrice?: number;
      discount?: number;
      limitedPrice?: LimitedPriceRecord;
      isActive?: boolean;
    }>;
  },
  variantId: string | undefined,
  quantity: number
): CheckoutLinePriceQuote {
  const qty = Math.max(0, Math.round(Number(quantity || 0)));
  const variant = variantId ? (product.variants || []).find((entry) => entry.id === variantId) : null;
  const priceSource = variant || product;
  const regular = resolveRegularUnitPrice(product, priceSource);
  const limited = resolveLimitedSource(product, variantId);
  const promo = resolvePromoUnitPrice(product, limited);
  const promoQuantity = promo ? Math.min(qty, getLimitedPromoRemaining(limited)) : 0;
  const regularQuantity = Math.max(0, qty - promoQuantity);
  const lineTotal = roundCurrency(
    promoQuantity * Number(promo?.unitPrice || 0) + regularQuantity * regular.unitPrice
  );

  return {
    promoQuantity,
    regularQuantity,
    promoUnitPrice: promoQuantity > 0 ? promo?.unitPrice : undefined,
    regularUnitPrice: regular.unitPrice,
    lineTotal,
    vatPercent: regular.vatPercent,
  };
}

const STALE_LIMITED_PRICE_MESSAGE =
  "A kosárban szereplő limitált ár már nem érvényes (elfogyott vagy csak részben érhető el). Frissítsd a kosarat, majd próbáld újra.";

/** Reject carts that still carry an old limited unit price after the promo quota is gone or reduced. */
export function assertClientCartLinePrice(
  clientUnitPrice: number | undefined,
  quantity: number,
  quote: CheckoutLinePriceQuote
): void {
  if (clientUnitPrice == null || !Number.isFinite(clientUnitPrice)) return;

  const qty = Math.max(1, Math.round(Number(quantity || 0)));
  const clientLineTotal = roundCurrency(Number(clientUnitPrice) * qty);
  const tolerance = qty;
  if (clientLineTotal + tolerance < quote.lineTotal) {
    throw new Error(STALE_LIMITED_PRICE_MESSAGE);
  }
}

export function getStaleLimitedPriceCartMessage(
  clientUnitPrice: number | undefined,
  quantity: number,
  quote: CheckoutLinePriceQuote
): string | null {
  if (clientUnitPrice == null || !Number.isFinite(clientUnitPrice)) return null;

  const qty = Math.max(1, Math.round(Number(quantity || 0)));
  const clientLineTotal = roundCurrency(Number(clientUnitPrice) * qty);
  const tolerance = qty;
  if (clientLineTotal + tolerance < quote.lineTotal) {
    return STALE_LIMITED_PRICE_MESSAGE;
  }
  return null;
}

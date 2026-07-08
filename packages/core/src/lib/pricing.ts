export const DEFAULT_VAT_PERCENT = 27
/** @deprecated Use DEFAULT_VAT_PERCENT */
export const VAT_PERCENT = DEFAULT_VAT_PERCENT
/** @deprecated Use vatRateFromPercent */
export const VAT_RATE = DEFAULT_VAT_PERCENT / 100

export function clampVatPercent(percent: unknown): number {
  const n = Number(percent)
  if (!Number.isFinite(n) || n < 0) return DEFAULT_VAT_PERCENT
  return Math.min(100, Math.max(0, Math.round(n)))
}

export function vatRateFromPercent(percent: unknown): number {
  return clampVatPercent(percent) / 100
}

export function roundHuf(value: number): number {
  return Math.round(Number(value || 0))
}

export function netToGross(netPrice: number, vatPercent?: number): number {
  const r = vatRateFromPercent(vatPercent ?? DEFAULT_VAT_PERCENT)
  return roundHuf(Number(netPrice || 0) * (1 + r))
}

export function grossToNet(grossPrice: number, vatPercent?: number): number {
  const r = vatRateFromPercent(vatPercent ?? DEFAULT_VAT_PERCENT)
  const denom = 1 + r
  if (denom <= 0) return roundHuf(Number(grossPrice || 0))
  return roundHuf(Number(grossPrice || 0) / denom)
}

/** Net stored in DB from a merchant-entered gross (HUF integers). UI may keep gross exact. */
export function deriveNetFromGross(grossPrice: number, vatPercent?: number): number {
  return grossToNet(grossPrice, vatPercent)
}

/** Customer-facing unit gross: stored gross wins over net-derived. */
export function customerUnitGross(
  netPrice: number,
  vatPercent?: number,
  storedGross?: number | null
): number {
  if (storedGross != null && Number.isFinite(storedGross) && storedGross > 0) {
    return roundHuf(storedGross)
  }
  return netToGross(netPrice, vatPercent)
}

export function customerGrossFromNetWithDiscount(
  netPrice: number,
  discount = 0,
  vatPercent?: number,
  storedGross?: number | null
): number {
  const base = customerUnitGross(netPrice, vatPercent, storedGross)
  return roundHuf(base * (1 - Number(discount || 0) / 100))
}

export function grossFromNetWithDiscount(netPrice: number, discount = 0, vatPercent?: number): number {
  const r = vatRateFromPercent(vatPercent ?? DEFAULT_VAT_PERCENT)
  const gross = Number(netPrice || 0) * (1 + r)
  return roundHuf(gross * (1 - Number(discount || 0) / 100))
}

export function netFromGrossWithDiscount(grossPrice: number, vatPercent?: number): number {
  return grossToNet(grossPrice, vatPercent)
}

export function priceBreakdownFromGross(grossPrice: number, quantity = 1, vatPercent?: number) {
  const pct = clampVatPercent(vatPercent ?? DEFAULT_VAT_PERCENT)
  const unitGross = roundHuf(grossPrice)
  const unitNet = grossToNet(unitGross, pct)
  const unitVat = unitGross - unitNet
  const qty = Number(quantity || 0)

  return {
    unitNet,
    unitVat,
    unitGross,
    lineNet: roundHuf(unitNet * qty),
    lineVat: roundHuf(unitVat * qty),
    lineGross: roundHuf(unitGross * qty),
    vatPercent: pct,
  }
}

export function totalsBreakdownFromGross(grossTotal: number, vatPercent?: number) {
  const pct = clampVatPercent(vatPercent ?? DEFAULT_VAT_PERCENT)
  const gross = roundHuf(grossTotal)
  const net = grossToNet(gross, pct)
  return {
    net,
    vat: gross - net,
    gross,
    vatPercent: pct,
  }
}

/** Sum lines that may carry different VAT rates (mixed cart). */
export function totalsFromMixedVatLines(
  lines: Array<{ grossUnit: number; quantity: number; vatPercent?: number }>
) {
  let net = 0
  let vat = 0
  let gross = 0
  for (const line of lines) {
    const bd = priceBreakdownFromGross(line.grossUnit, line.quantity, line.vatPercent)
    net += bd.lineNet
    vat += bd.lineVat
    gross += bd.lineGross
  }
  return {
    net: roundHuf(net),
    vat: roundHuf(vat),
    gross: roundHuf(gross),
  }
}

/** Highest VAT % among cart/order lines (for shipping/payment fee allocation on invoices). */
export function highestCartVatPercent(
  items: Array<{ vatPercent?: number }>,
  fallback = DEFAULT_VAT_PERCENT
): number {
  if (!items.length) return fallback
  return Math.max(...items.map((i) => clampVatPercent(i.vatPercent ?? fallback)))
}

/** Net/VAT split for a fee gross at the cart's highest product VAT rate. */
export function feeLineBreakdownFromGross(
  gross: number,
  cartItems: Array<{ vatPercent?: number }>
) {
  const bd = priceBreakdownFromGross(gross, 1, highestCartVatPercent(cartItems))
  return {
    gross: bd.lineGross,
    net: bd.lineNet,
    vat: bd.lineVat,
    vatPercent: bd.vatPercent,
  }
}

/**
 * Net / VAT split for a completed order: goods lines use stored per-line `vatPercent` and post-discount
 * gross is inferred the same way as checkout (scale line gross by `total - fees` vs `subtotal`).
 * Shipping and payment fee lines use the cart's highest product VAT %.
 */
export function totalsBreakdownForOrderSnapshot(order: {
  items: Array<{ price: number; quantity: number; vatPercent?: number }>
  subtotal: number
  shippingFee: number
  paymentFee: number
  total: number
}) {
  const st = roundHuf(Number(order.subtotal ?? 0))
  const sf = roundHuf(Number(order.shippingFee ?? 0))
  const pf = roundHuf(Number(order.paymentFee ?? 0))
  const ttl = roundHuf(Number(order.total ?? 0))
  const goodsAfterDiscount = Math.max(0, ttl - sf - pf)
  const scale = st > 0 ? goodsAfterDiscount / st : 1
  const mixed = totalsFromMixedVatLines(
    order.items.map((i) => ({
      grossUnit: roundHuf(Number(i.price) * scale),
      quantity: Number(i.quantity) || 0,
      vatPercent: clampVatPercent(i.vatPercent ?? DEFAULT_VAT_PERCENT),
    }))
  )
  const feeVat = highestCartVatPercent(order.items)
  let net = mixed.net
  let vat = mixed.vat
  if (sf > 0) {
    const s = priceBreakdownFromGross(sf, 1, feeVat)
    net += s.lineNet
    vat += s.lineVat
  }
  if (pf > 0) {
    const p = priceBreakdownFromGross(pf, 1, feeVat)
    net += p.lineNet
    vat += p.lineVat
  }
  return {
    net: roundHuf(net),
    vat: roundHuf(vat),
    gross: ttl,
  }
}

export type ListingPriceLine = {
  netPrice: number
  discount?: number
  grossPrice?: number | null
}

/** Infer VAT % from merchant-entered net + gross pair (e.g. 1930 → 2026 ⇒ 5%). */
export function impliedVatPercentFromNetGross(netPrice: number, grossPrice: number): number | null {
  const net = roundHuf(netPrice)
  const gross = roundHuf(grossPrice)
  if (net <= 0 || gross <= net) return null
  const pct = Math.round((gross / net - 1) * 100)
  if (pct < 0 || pct > 100) return null
  return pct
}

/** VAT for a catalog line: stored gross+net pair wins, else product-level rate. */
export function listingLineVatPercent(line: ListingPriceLine, productVatPercent?: number): number {
  const storedGross = line.grossPrice
  if (storedGross != null && Number.isFinite(storedGross) && storedGross > 0) {
    const implied = impliedVatPercentFromNetGross(line.netPrice, storedGross)
    if (implied != null) return implied
  }
  return clampVatPercent(productVatPercent)
}

/** Customer-facing gross for a catalog/search line (respects stored gross). */
export function listingCustomerGross(line: ListingPriceLine, vatPercent?: number): number {
  const pct = listingLineVatPercent(line, vatPercent)
  return customerGrossFromNetWithDiscount(
    Number(line.netPrice || 0),
    Number(line.discount || 0),
    pct,
    line.grossPrice
  )
}

/** Lowest "from" price across variant (or single) lines for shop grids and cards. */
export function listingPriceSummary(lines: ListingPriceLine[], vatPercent?: number) {
  if (lines.length === 0) {
    const pct = clampVatPercent(vatPercent)
    return {
      unitGross: 0,
      unitNet: 0,
      unitVat: 0,
      vatPercent: pct,
      maxDiscount: 0,
      compareGross: 0,
    }
  }
  const priced = lines.map((line) => {
    const pct = listingLineVatPercent(line, vatPercent)
    const gross = listingCustomerGross(line, vatPercent)
    return { line, pct, gross }
  })
  const cheapest = priced.reduce((min, row) => (row.gross < min.gross ? row : min))
  const unitGross = cheapest.gross
  const maxDiscount = Math.max(...lines.map((line) => Number(line.discount || 0)))
  const breakdown = priceBreakdownFromGross(unitGross, 1, cheapest.pct)
  const compareGross = customerUnitGross(
    Number(cheapest.line.netPrice || 0),
    cheapest.pct,
    cheapest.line.grossPrice
  )
  return {
    unitGross,
    unitNet: breakdown.unitNet,
    unitVat: breakdown.unitVat,
    vatPercent: cheapest.pct,
    maxDiscount,
    compareGross,
  }
}

export function listingHasPriceRange(lines: ListingPriceLine[], vatPercent?: number): boolean {
  const prices = lines.map((line) => listingCustomerGross(line, vatPercent))
  if (prices.length < 2) return false
  const first = prices[0]
  return prices.some((price) => price !== first)
}

export function formatHuf(value: number): string {
  return `${roundHuf(value).toLocaleString("hu-HU")} FT`
}

type DiscountAllocatableLine = {
  price?: number;
  quantity: number;
};

/** Spread a cart-level gross discount across line items so Stripe/invoices use paid unit prices. */
export function distributeCheckoutDiscountToItems<T extends DiscountAllocatableLine>(
  items: T[],
  discountGross: number
): T[] {
  const discount = Math.max(0, roundHuf(Number(discountGross || 0)));
  if (discount <= 0 || items.length === 0) return items;

  const lineGrossTotals = items.map(
    (item) => roundHuf(Number(item.price || 0) * Number(item.quantity || 0))
  );
  const subtotal = lineGrossTotals.reduce((sum, value) => sum + value, 0);
  if (subtotal <= 0) return items;

  const appliedDiscount = Math.min(discount, subtotal);
  let remainingDiscount = appliedDiscount;

  return items.map((item, index) => {
    const lineGross = lineGrossTotals[index];
    const quantity = Math.max(1, Number(item.quantity || 1));
    const isLast = index === items.length - 1;
    const lineDiscount = isLast
      ? remainingDiscount
      : roundHuf(appliedDiscount * (lineGross / subtotal));
    remainingDiscount = Math.max(0, remainingDiscount - lineDiscount);

    const nextLineGross = Math.max(0, lineGross - lineDiscount);
    return {
      ...item,
      price: roundHuf(nextLineGross / quantity),
    };
  });
}

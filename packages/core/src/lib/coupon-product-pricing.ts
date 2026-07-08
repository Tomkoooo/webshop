import { clampVatPercent, netToGross, roundHuf } from "@wse/core/lib/pricing";
import type { CouponProductPriceMode } from "@wse/core/models/Coupon";

export function couponProductRuleKey(product: string, variantId?: string | null): string {
  return `${String(product)}:${variantId?.trim() || ""}`;
}

export type CouponProductPriceRuleInput = {
  product: string;
  variantId?: string | null;
  mode: CouponProductPriceMode | string;
  value: number;
};

export function findProductPriceRule(
  rules: CouponProductPriceRuleInput[] | undefined,
  productId: string,
  variantId?: string | null
): CouponProductPriceRuleInput | null {
  if (!Array.isArray(rules) || rules.length === 0) return null;

  const forProduct = rules.filter((rule) => String(rule.product) === String(productId));
  if (forProduct.length === 0) return null;

  const variantKey = variantId?.trim() || "";
  if (variantKey) {
    const exact = forProduct.find((rule) => rule.variantId?.trim() === variantKey);
    if (exact) return exact;
  }

  return forProduct.find((rule) => !rule.variantId?.trim()) ?? null;
}

export function computeCouponUnitGross(
  baseUnitGross: number,
  vatPercent: number,
  rule: Pick<CouponProductPriceRuleInput, "mode" | "value">
): number {
  const pct = clampVatPercent(vatPercent);
  const value = Number(rule.value || 0);

  if (rule.mode === "percentage") {
    const factor = Math.max(0, Math.min(100, value)) / 100;
    return roundHuf(Math.max(0, baseUnitGross * (1 - factor)));
  }
  if (rule.mode === "fixed_gross") {
    return roundHuf(Math.max(0, value));
  }
  if (rule.mode === "fixed_net") {
    return roundHuf(Math.max(0, netToGross(value, pct)));
  }
  return roundHuf(baseUnitGross);
}

export type CheckoutLineForCoupon = {
  product: string;
  variantId?: string;
  quantity: number;
  price: number;
  vatPercent?: number;
};

export function applyProductPriceRulesToLines<T extends CheckoutLineForCoupon>(
  lines: T[],
  rules: CouponProductPriceRuleInput[] | undefined
): { lines: T[]; adjustedSubtotal: number; matchedLineCount: number } {
  if (!Array.isArray(rules) || rules.length === 0) {
    const subtotal = lines.reduce(
      (sum, line) => sum + Number(line.price || 0) * Number(line.quantity || 0),
      0
    );
    return { lines, adjustedSubtotal: roundHuf(subtotal), matchedLineCount: 0 };
  }

  let matchedLineCount = 0;
  const nextLines = lines.map((line) => {
    const rule = findProductPriceRule(rules, line.product, line.variantId);
    if (!rule) return line;

    matchedLineCount += 1;
    const unitGross = computeCouponUnitGross(
      Number(line.price || 0),
      line.vatPercent ?? 27,
      rule
    );
    return { ...line, price: unitGross };
  });

  const adjustedSubtotal = roundHuf(
    nextLines.reduce((sum, line) => sum + Number(line.price || 0) * Number(line.quantity || 0), 0)
  );

  return { lines: nextLines, adjustedSubtotal, matchedLineCount };
}

import mongoose from "mongoose";
import Coupon, {
  DiscountType,
  type ICoupon,
  type ICouponProductPriceRule,
} from "@wse/core/models/Coupon";
import {
  applyProductPriceRulesToLines,
  couponProductRuleKey,
  type CheckoutLineForCoupon,
  type CouponProductPriceRuleInput,
} from "@wse/core/lib/coupon-product-pricing";
import { countCouponUsesForUser } from "@wse/core/lib/coupon-usage";

export type CouponCartLine = CheckoutLineForCoupon & {
  productId?: string;
};

export type CouponApplyResult = {
  couponCodes: string[];
  discount: number;
  freeShipping: boolean;
  type: DiscountType;
  adjustedSubtotal?: number;
  adjustedLines?: CheckoutLineForCoupon[];
  lineAdjustments?: Array<{
    productId: string;
    variantId?: string;
    unitGross: number;
    quantity: number;
  }>;
};

function roundCurrency(value: number): number {
  return Math.round(value);
}

function dedupeProductPriceRules<T extends { product: unknown; variantId?: string | null }>(
  rules: T[]
): T[] {
  const seen = new Set<string>();
  return rules.filter((rule) => {
    const key = couponProductRuleKey(String(rule.product), rule.variantId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeCouponRules(
  rules: ICouponProductPriceRule[] | undefined
): CouponProductPriceRuleInput[] {
  if (!Array.isArray(rules)) return [];
  return rules.map((rule) => ({
    product: String(rule.product),
    variantId: rule.variantId?.trim() || undefined,
    mode: rule.mode,
    value: Number(rule.value || 0),
  }));
}

export function mapCouponCartLines(items: CouponCartLine[]): CheckoutLineForCoupon[] {
  return items.map((item) => ({
    product: String(item.product || item.productId || ""),
    variantId: item.variantId || undefined,
    quantity: Number(item.quantity || 0),
    price: Number(item.price || 0),
    vatPercent: item.vatPercent,
  }));
}

export async function loadActiveCoupon(code: string | undefined): Promise<ICoupon | null> {
  if (!code?.trim()) return null;
  const normalizedCode = code.toUpperCase().trim();
  return Coupon.findOne({ code: normalizedCode, isActive: true });
}

export async function assertCouponEligibility(
  coupon: ICoupon,
  context: { subtotal: number; userId?: string; email?: string }
): Promise<void> {
  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    throw new Error("A kupon lejárt vagy még nem érvényes");
  }
  if (coupon.minCartValue && context.subtotal < coupon.minCartValue) {
    throw new Error(
      `A kupon használatához minimum ${coupon.minCartValue.toLocaleString("hu-HU")} FT értékű kosár szükséges`
    );
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new Error("A kupon felhasználási limitje elfogyott");
  }
  if (coupon.maxUsesPerUser) {
    const userUses = await countCouponUsesForUser(coupon.code, {
      userId: context.userId,
      email: context.email,
    });
    if (userUses >= coupon.maxUsesPerUser) {
      throw new Error(
        `Ezzel az e-mail címmel a kupon már a maximális (${coupon.maxUsesPerUser}) alkalommal lett felhasználva`
      );
    }
  }
  if (Array.isArray(coupon.applicableUsers) && coupon.applicableUsers.length > 0) {
    if (
      !context.userId ||
      !coupon.applicableUsers.some((entry) => entry.toString() === context.userId)
    ) {
      throw new Error("Ez a kupon az Ön számára nem elérhető");
    }
  }
}

export function applyCouponToCart(
  coupon: ICoupon,
  subtotal: number,
  items: CouponCartLine[] = []
): CouponApplyResult {
  const base: CouponApplyResult = {
    couponCodes: [coupon.code],
    discount: 0,
    freeShipping: false,
    type: coupon.type,
  };

  if (coupon.type === DiscountType.FREE_SHIPPING) {
    return { ...base, freeShipping: true };
  }

  if (coupon.type === DiscountType.PRODUCT_PRICE) {
    const rules = normalizeCouponRules(coupon.productPriceRules);
    if (rules.length === 0) {
      throw new Error("A termékáras kuponhoz nincs beállított szabály");
    }

    const lines = mapCouponCartLines(items);
    const applied = applyProductPriceRulesToLines(lines, rules);
    if (applied.matchedLineCount === 0) {
      throw new Error("A kupon egyik kosár tételére sem érvényes");
    }

    return {
      ...base,
      discount: Math.max(0, roundCurrency(subtotal - applied.adjustedSubtotal)),
      adjustedSubtotal: applied.adjustedSubtotal,
      adjustedLines: applied.lines,
      lineAdjustments: applied.lines
        .filter((line) =>
          rules.some(
            (rule) =>
              String(rule.product) === String(line.product) &&
              (!rule.variantId?.trim() ||
                rule.variantId.trim() === (line.variantId?.trim() || ""))
          )
        )
        .map((line) => ({
          productId: String(line.product),
          variantId: line.variantId,
          unitGross: Number(line.price || 0),
          quantity: Number(line.quantity || 0),
        })),
    };
  }

  if (coupon.type === DiscountType.PERCENTAGE) {
    return {
      ...base,
      discount: roundCurrency(subtotal * (Number(coupon.value || 0) / 100)),
    };
  }

  return {
    ...base,
    discount: Math.max(0, roundCurrency(Number(coupon.value || 0))),
  };
}

export async function validateAndApplyCoupon(
  code: string | undefined,
  subtotal: number,
  options?: { userId?: string; email?: string; items?: CouponCartLine[] }
): Promise<CouponApplyResult> {
  if (!code?.trim()) {
    return {
      couponCodes: [],
      discount: 0,
      freeShipping: false,
      type: DiscountType.PERCENTAGE,
    };
  }

  const coupon = await loadActiveCoupon(code);
  if (!coupon) {
    throw new Error("Érvénytelen kuponkód");
  }

  await assertCouponEligibility(coupon, {
    subtotal,
    userId: options?.userId,
    email: options?.email,
  });
  return applyCouponToCart(coupon, subtotal, options?.items ?? []);
}

export function normalizeCouponPayload(data: {
  code: string;
  type: string;
  value?: number;
  minCartValue?: number;
  startDate: Date;
  endDate: Date;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  isActive?: boolean;
  productPriceRules?: Array<{
    product: string;
    variantId?: string | null;
    mode: string;
    value: number;
  }>;
}) {
  const type =
    data.type === "fixed"
      ? DiscountType.FIXED_AMOUNT
      : data.type === "free_shipping"
        ? DiscountType.FREE_SHIPPING
        : data.type === "product_price"
          ? DiscountType.PRODUCT_PRICE
          : DiscountType.PERCENTAGE;

  const productPriceRules =
    type === DiscountType.PRODUCT_PRICE
      ? dedupeProductPriceRules(
          (data.productPriceRules || [])
            .filter((rule) => mongoose.Types.ObjectId.isValid(rule.product))
            .map((rule) => ({
              product: new mongoose.Types.ObjectId(rule.product),
              variantId: rule.variantId?.trim() || undefined,
              mode: rule.mode,
              value: Number(rule.value || 0),
            }))
        )
      : undefined;

  if (type === DiscountType.PRODUCT_PRICE && (!productPriceRules || productPriceRules.length === 0)) {
    throw new Error("Adj meg legalább egy termékáras szabályt.");
  }

  if (type === DiscountType.PRODUCT_PRICE && productPriceRules) {
    const keys = productPriceRules.map((rule) =>
      couponProductRuleKey(String(rule.product), rule.variantId)
    );
    if (keys.length !== new Set(keys).size) {
      throw new Error("Ugyanaz a termék + variáns kombináció csak egyszer szerepelhet.");
    }
  }

  return {
    code: data.code.toUpperCase().trim(),
    type,
    value: type === DiscountType.PRODUCT_PRICE || type === DiscountType.FREE_SHIPPING ? 0 : Number(data.value || 0),
    minCartValue: Number(data.minCartValue || 0),
    startDate: data.startDate,
    endDate: data.endDate,
    maxUses: data.maxUses ?? undefined,
    maxUsesPerUser: data.maxUsesPerUser ?? undefined,
    isActive: data.isActive !== false,
    productPriceRules,
  };
}

/** @deprecated Use normalizeCouponPayload */
export const normalizeCouponCreatePayload = normalizeCouponPayload;

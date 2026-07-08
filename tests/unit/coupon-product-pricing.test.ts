import { describe, expect, it } from "vitest";
import {
  applyProductPriceRulesToLines,
  computeCouponUnitGross,
  couponProductRuleKey,
  findProductPriceRule,
} from "@wse/core/lib/coupon-product-pricing";

describe("coupon-product-pricing", () => {
  it("builds stable rule keys for product + variant combinations", () => {
    expect(couponProductRuleKey("p1")).toBe("p1:");
    expect(couponProductRuleKey("p1", "v1")).toBe("p1:v1");
    expect(couponProductRuleKey("p1", "  ")).toBe("p1:");
  });

  const rules = [
    { product: "p1", mode: "percentage" as const, value: 10 },
    { product: "p2", variantId: "v2", mode: "fixed_gross" as const, value: 5000 },
    { product: "p3", mode: "fixed_net" as const, value: 1000 },
  ];

  it("finds variant-specific rule before product-wide rule", () => {
    const allVariants = findProductPriceRule(
      [
        { product: "p1", mode: "percentage", value: 5 },
        { product: "p1", variantId: "v1", mode: "fixed_gross", value: 9000 },
      ],
      "p1",
      "v1"
    );
    expect(allVariants?.mode).toBe("fixed_gross");
    expect(allVariants?.value).toBe(9000);

    const fallback = findProductPriceRule(
      [
        { product: "p1", mode: "percentage", value: 5 },
        { product: "p1", variantId: "v1", mode: "fixed_gross", value: 9000 },
      ],
      "p1",
      "v9"
    );
    expect(fallback?.mode).toBe("percentage");
  });

  it("computes percentage, fixed gross, and fixed net unit prices", () => {
    expect(computeCouponUnitGross(10000, 27, { mode: "percentage", value: 10 })).toBe(9000);
    expect(computeCouponUnitGross(10000, 27, { mode: "fixed_gross", value: 7500 })).toBe(7500);
    expect(computeCouponUnitGross(10000, 27, { mode: "fixed_net", value: 1000 })).toBe(1270);
  });

  it("applies rules to matching cart lines only", () => {
    const lines = [
      { product: "p1", quantity: 2, price: 10000, vatPercent: 27 },
      { product: "p2", variantId: "v1", quantity: 1, price: 8000, vatPercent: 27 },
      { product: "p2", variantId: "v2", quantity: 1, price: 8000, vatPercent: 27 },
      { product: "p9", quantity: 1, price: 3000, vatPercent: 27 },
    ];

    const applied = applyProductPriceRulesToLines(lines, rules);
    expect(applied.matchedLineCount).toBe(2);
    expect(applied.lines[0].price).toBe(9000);
    expect(applied.lines[1].price).toBe(8000);
    expect(applied.lines[2].price).toBe(5000);
    expect(applied.lines[3].price).toBe(3000);
    expect(applied.adjustedSubtotal).toBe(9000 * 2 + 8000 + 5000 + 3000);
  });
});

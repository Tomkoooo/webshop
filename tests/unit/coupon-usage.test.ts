import { describe, expect, it } from "vitest";
import {
  buildCouponUserUsageFilter,
  normalizeCouponEmail,
} from "@wse/core/lib/coupon-usage";

describe("coupon-usage", () => {
  it("normalizes e-mail addresses", () => {
    expect(normalizeCouponEmail("  Test@Example.COM ")).toBe("test@example.com");
  });

  it("builds user usage filter with user id and e-mail", () => {
    const filter = buildCouponUserUsageFilter("SAVE10", {
      userId: "507f1f77bcf86cd799439011",
      email: "buyer@test.hu",
    });

    expect(filter.couponCodes).toBe("SAVE10");
    expect(filter.status).toEqual({ $ne: "cancelled" });
    expect(filter.$or).toHaveLength(2);
  });
});

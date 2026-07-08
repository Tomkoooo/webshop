import dbConnect from "@wse/core/lib/db";
import Coupon from "@wse/core/models/Coupon";
import Order from "@wse/core/models/Order";
import mongoose from "mongoose";

export function normalizeCouponEmail(email?: string | null): string {
  return String(email || "")
    .trim()
    .toLowerCase();
}

export function buildCouponUserUsageFilter(
  couponCode: string,
  context: { userId?: string; email?: string }
): Record<string, unknown> {
  const code = couponCode.toUpperCase().trim();
  const email = normalizeCouponEmail(context.email);
  const userClauses: Record<string, unknown>[] = [];

  if (context.userId && mongoose.Types.ObjectId.isValid(context.userId)) {
    userClauses.push({ user: new mongoose.Types.ObjectId(context.userId) });
  }
  if (email) {
    userClauses.push({
      "billingInfo.email": {
        $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      },
    });
  }

  const filter: Record<string, unknown> = {
    couponCodes: code,
    status: { $ne: "cancelled" },
  };

  if (userClauses.length > 0) {
    filter.$or = userClauses;
  }

  return filter;
}

export async function countCouponUsesForUser(
  couponCode: string,
  context: { userId?: string; email?: string }
): Promise<number> {
  const email = normalizeCouponEmail(context.email);
  if (!context.userId && !email) return 0;

  await dbConnect();
  return Order.countDocuments(buildCouponUserUsageFilter(couponCode, context));
}

export async function recordCouponRedemptions(
  couponCodes: string[] | undefined,
  _context?: { userId?: string; email?: string }
): Promise<void> {
  void _context;
  if (!Array.isArray(couponCodes) || couponCodes.length === 0) return;

  await dbConnect();
  const uniqueCodes = [...new Set(couponCodes.map((code) => code.toUpperCase().trim()).filter(Boolean))];

  for (const code of uniqueCodes) {
    await Coupon.findOneAndUpdate({ code }, { $inc: { usedCount: 1 } });
  }
}

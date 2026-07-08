import { randomBytes } from "crypto";
import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import OrderGuestAccessToken from "@wse/core/models/OrderGuestAccessToken";
import {
  ORDER_GUEST_ACCESS_TTL_MS,
  buildGuestOrderViewUrl,
  normalizeOrderEmail,
  resolveAppBaseUrl,
} from "@wse/core/lib/order-guest-access";
import { sha256Hex } from "@wse/core/lib/password";

export class OrderGuestAccessService {
  static async createForOrder(orderId: string, email: string): Promise<string> {
    await dbConnect();
    const normalizedEmail = normalizeOrderEmail(email);
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = sha256Hex(rawToken);
    const expiresAt = new Date(Date.now() + ORDER_GUEST_ACCESS_TTL_MS);

    await OrderGuestAccessToken.deleteMany({
      order: new mongoose.Types.ObjectId(orderId),
      claimedAt: { $exists: false },
    });

    await OrderGuestAccessToken.create({
      order: new mongoose.Types.ObjectId(orderId),
      email: normalizedEmail,
      tokenHash,
      expiresAt,
    });

    return rawToken;
  }

  static async verifyToken(orderId: string, rawToken: string): Promise<boolean> {
    if (!rawToken || !mongoose.Types.ObjectId.isValid(orderId)) return false;

    await dbConnect();
    const tokenHash = sha256Hex(rawToken);
    const entry = await OrderGuestAccessToken.findOne({
      order: new mongoose.Types.ObjectId(orderId),
      tokenHash,
      expiresAt: { $gt: new Date() },
    }).lean();

    return Boolean(entry);
  }

  static buildViewUrl(orderId: string, rawToken: string): string {
    return buildGuestOrderViewUrl(orderId, rawToken, resolveAppBaseUrl());
  }

  static async linkGuestOrdersToUser(userId: string, email: string): Promise<number> {
    const normalized = normalizeOrderEmail(email);
    if (!normalized || !mongoose.Types.ObjectId.isValid(userId)) return 0;

    await dbConnect();
    const result = await Order.updateMany(
      {
        $or: [{ user: { $exists: false } }, { user: null }],
        $expr: {
          $eq: [{ $toLower: { $trim: { input: "$billingInfo.email" } } }, normalized],
        },
      },
      { $set: { user: new mongoose.Types.ObjectId(userId) } }
    );

    if (result.modifiedCount > 0) {
      await OrderGuestAccessToken.updateMany(
        {
          email: normalized,
          claimedAt: { $exists: false },
        },
        {
          $set: {
            claimedByUser: new mongoose.Types.ObjectId(userId),
            claimedAt: new Date(),
          },
        }
      );
    }

    return result.modifiedCount ?? 0;
  }

  static async claimOrderForUser(
    orderId: string,
    rawToken: string,
    userId: string,
    userEmail: string
  ): Promise<{ ok: boolean; reason?: string }> {
    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return { ok: false, reason: "invalid_id" };
    }

    const valid = await this.verifyToken(orderId, rawToken);
    if (!valid) return { ok: false, reason: "invalid_token" };

    await dbConnect();
    const order = await Order.findById(orderId).lean();
    if (!order) return { ok: false, reason: "order_not_found" };

    const orderEmail = normalizeOrderEmail(order.billingInfo?.email || "");
    const sessionEmail = normalizeOrderEmail(userEmail);
    if (!orderEmail || orderEmail !== sessionEmail) {
      return { ok: false, reason: "email_mismatch" };
    }

    if (order.user && String(order.user) !== userId) {
      return { ok: false, reason: "already_claimed" };
    }

    await Order.findByIdAndUpdate(orderId, { $set: { user: new mongoose.Types.ObjectId(userId) } });

    const tokenHash = sha256Hex(rawToken);
    await OrderGuestAccessToken.findOneAndUpdate(
      { order: new mongoose.Types.ObjectId(orderId), tokenHash },
      {
        $set: {
          claimedByUser: new mongoose.Types.ObjectId(userId),
          claimedAt: new Date(),
        },
      }
    );

    return { ok: true };
  }
}

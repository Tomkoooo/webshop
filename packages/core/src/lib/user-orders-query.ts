import mongoose from "mongoose";
import type { Session } from "next-auth";
import { resolveAuthenticatedUserId } from "@wse/core/lib/auth-session-user";
import { normalizeOrderEmail } from "@wse/core/lib/order-guest-access";
import { OrderGuestAccessService } from "@wse/core/services/order-guest-access";

/** Orders owned by user id, plus unlinked guest orders with matching billing email. */
export function buildUserOrdersFilter(userId: string, email?: string | null) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid user id for order query");
  }
  const owned = { user: new mongoose.Types.ObjectId(userId) };
  const normalized = email ? normalizeOrderEmail(email) : "";
  if (!normalized) return owned;

  return {
    $or: [
      owned,
      {
        $or: [{ user: { $exists: false } }, { user: null }],
        $expr: {
          $eq: [{ $toLower: { $trim: { input: "$billingInfo.email" } } }, normalized],
        },
      },
    ],
  };
}

/**
 * Resolves the Mongo user id, links guest orders by billing email, and returns a list filter.
 */
export async function prepareUserOrdersAccess(session: Session | null): Promise<{
  userId: string;
  filter: ReturnType<typeof buildUserOrdersFilter>;
} | null> {
  const userId = await resolveAuthenticatedUserId(session);
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;

  const email = session?.user?.email?.trim();
  if (email) {
    try {
      await OrderGuestAccessService.linkGuestOrdersToUser(userId, email);
    } catch (error) {
      console.error("linkGuestOrdersToUser failed:", error);
    }
  }

  return {
    userId,
    filter: buildUserOrdersFilter(userId, email),
  };
}

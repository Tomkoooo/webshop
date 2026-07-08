import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@wse/core/auth";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { resolveAuthenticatedUserId } from "@wse/core/lib/auth-session-user";
import { OrderGuestAccessService } from "@wse/core/services/order-guest-access";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;

    const session = await auth();
    const userId = await resolveAuthenticatedUserId(session);
    const userEmail = session?.user?.email?.trim();
    if (!userId || !userEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Érvénytelen rendelés azonosító." }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return NextResponse.json({ error: "Hiányzó token." }, { status: 400 });
    }

    const result = await OrderGuestAccessService.claimOrderForUser(id, token, userId, userEmail);
    if (!result.ok) {
      const status =
        result.reason === "invalid_token"
          ? 403
          : result.reason === "email_mismatch" || result.reason === "already_claimed"
            ? 409
            : 400;
      return NextResponse.json({ error: result.reason }, { status });
    }

    await OrderGuestAccessService.linkGuestOrdersToUser(userId, userEmail);

    return NextResponse.json({ success: true, orderId: id });
  } catch (error) {
    console.error("Guest order claim error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

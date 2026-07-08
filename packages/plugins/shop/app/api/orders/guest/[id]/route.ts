import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import Product from "@wse/core/models/Product";
import ShippingMethod from "@wse/core/models/ShippingMethod";
import PaymentMethod from "@wse/core/models/PaymentMethod";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { resolveAuthenticatedUserId } from "@wse/core/lib/auth-session-user";
import { orderDetailApiPayload } from "@wse/core/lib/order-api-payload";
import { OrderGuestAccessService } from "@wse/core/services/order-guest-access";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;

    const { id } = await params;
    const token = req.nextUrl.searchParams.get("token")?.trim();
    if (!token) {
      return NextResponse.json({ error: "Hiányzó hozzáférési token." }, { status: 400 });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Érvénytelen rendelés azonosító." }, { status: 400 });
    }

    const valid = await OrderGuestAccessService.verifyToken(id, token);
    if (!valid) {
      return NextResponse.json({ error: "A link érvénytelen vagy lejárt." }, { status: 403 });
    }

    await dbConnect();
    void Product;
    void ShippingMethod;
    void PaymentMethod;

    const order = await Order.findById(id)
      .populate("items.product")
      .populate("shippingMethod")
      .populate("paymentMethod")
      .lean();

    if (!order) {
      return NextResponse.json({ error: "Rendelés nem található" }, { status: 404 });
    }

    const session = await auth();
    const userId = await resolveAuthenticatedUserId(session);
    let claimedToAccount = false;
    if (userId && session?.user?.email && !order.user) {
      const claim = await OrderGuestAccessService.claimOrderForUser(
        id,
        token,
        userId,
        session.user.email
      );
      if (claim.ok) {
        claimedToAccount = true;
        await OrderGuestAccessService.linkGuestOrdersToUser(userId, session.user.email);
      }
    }

    const safeOrder = orderDetailApiPayload(order as Record<string, unknown>, id);

    return NextResponse.json({
      ...safeOrder,
      guestAccess: true,
      claimedToAccount,
    });
  } catch (error) {
    console.error("Guest order GET error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

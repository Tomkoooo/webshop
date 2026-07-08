import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import TempOrder from "@wse/core/models/TempOrder";
import { CheckoutFinalizationService } from "@wse/core/services/checkout-finalization";
import { getStripeClient } from "@wse/core/services/stripe";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { confirmPendingReservationsForTempOrder } from "@wse/core/services/inventory-reservation";

export const runtime = "nodejs";

function sessionBelongsToTempOrder(
  tempOrderId: string,
  stripeSessionId: string,
  tempOrderStripeSessionId: string | undefined,
  metadataTempId: string | null | undefined,
  clientRef: string | null | undefined
): boolean {
  if (metadataTempId === tempOrderId || clientRef === tempOrderId) return true;
  if (!metadataTempId && !clientRef && tempOrderStripeSessionId === stripeSessionId) return true;
  return false;
}

export async function GET(req: NextRequest) {
  try {
    const blocked = shopCommerceBlockedResponse();
    if (blocked) return blocked;
    const { searchParams } = new URL(req.url);
    const tempOrderId = searchParams.get("tempOrderId");
    const sessionId = searchParams.get("session_id");

    if (!tempOrderId || !mongoose.Types.ObjectId.isValid(tempOrderId)) {
      return NextResponse.json({ error: "Hiányzó vagy érvénytelen tempOrderId" }, { status: 400 });
    }

    await dbConnect();
    const tempOrder = await TempOrder.findById(tempOrderId).lean();
    if (!tempOrder) {
      return NextResponse.json({ error: "Az ideiglenes rendelés nem található" }, { status: 404 });
    }
    if (sessionId && tempOrder.stripeSessionId && sessionId !== tempOrder.stripeSessionId) {
      return NextResponse.json({ error: "Session mismatch" }, { status: 400 });
    }

    if (tempOrder.status === "finalized" && tempOrder.finalizedOrderId) {
      return NextResponse.json({
        status: tempOrder.status,
        finalized: true,
        orderId: tempOrder.finalizedOrderId.toString(),
        guestAccessToken: tempOrder.guestAccessToken ?? null,
        lastError: null,
      });
    }

    if (!sessionId) {
      return NextResponse.json({
        status: tempOrder.status,
        finalized: false,
        orderId: null,
        lastError: tempOrder.lastError || null,
      });
    }

    const stripe = getStripeClient();
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      !sessionBelongsToTempOrder(
        tempOrderId,
        checkoutSession.id,
        tempOrder.stripeSessionId,
        checkoutSession.metadata?.tempOrderId ?? null,
        checkoutSession.client_reference_id ?? null
      )
    ) {
      return NextResponse.json({ error: "A fizetési munkamenet nem tartozik ehhez a rendeléshez." }, { status: 400 });
    }

    if (checkoutSession.payment_status !== "paid") {
      return NextResponse.json({
        status: tempOrder.status,
        finalized: false,
        orderId: null,
        lastError: tempOrder.lastError || null,
        paymentPending: true,
      });
    }

    const paymentIntentRaw = checkoutSession.payment_intent;
    const paymentIntentId =
      typeof paymentIntentRaw === "string" ? paymentIntentRaw : paymentIntentRaw?.id;

    await TempOrder.findOneAndUpdate(
      {
        _id: tempOrderId,
        status: { $in: ["created", "checkout_started"] },
      },
      {
        $set: {
          status: "paid",
          stripePaymentIntentId: paymentIntentId || tempOrder.stripePaymentIntentId,
        },
      }
    );

    try {
      await confirmPendingReservationsForTempOrder(tempOrderId);
      await CheckoutFinalizationService.finalizeFromTempOrder(tempOrderId);
    } catch (finalizeErr) {
      console.error("Stripe status GET finalize error:", finalizeErr);
    }

    const latest = await TempOrder.findById(tempOrderId).lean();
    const finalized = latest?.status === "finalized";
    const orderId =
      finalized && latest?.finalizedOrderId ? latest.finalizedOrderId.toString() : null;

    return NextResponse.json({
      status: latest?.status ?? tempOrder.status,
      finalized,
      orderId,
      guestAccessToken: latest?.guestAccessToken ?? null,
      lastError: latest?.lastError ?? null,
    });
  } catch (error: any) {
    console.error("Stripe status GET error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

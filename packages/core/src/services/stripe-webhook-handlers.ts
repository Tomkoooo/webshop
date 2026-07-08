import mongoose from "mongoose";
import TempOrder from "@wse/core/models/TempOrder";
import StripeWebhookEvent from "@wse/core/models/StripeWebhookEvent";
import { CheckoutFinalizationService } from "@wse/core/services/checkout-finalization";
import {
  confirmPendingReservationsForTempOrder,
  releaseReservationsForTempOrder,
} from "@wse/core/services/inventory-reservation";
import { getStripeClient } from "@wse/core/services/stripe";

export async function tryBeginStripeWebhook(eventId: string, type: string): Promise<boolean> {
  try {
    await StripeWebhookEvent.create([{ stripeEventId: eventId, type, status: "processing" }]);
    return true;
  } catch (e: any) {
    if (e?.code !== 11000) throw e;
    const existing = await StripeWebhookEvent.findOne({ stripeEventId: eventId }).lean();
    if (existing?.status === "processed") return false;
    return true;
  }
}

export async function markStripeWebhookProcessed(eventId: string) {
  await StripeWebhookEvent.updateOne(
    { stripeEventId: eventId },
    { $set: { status: "processed", processedAt: new Date(), lastError: undefined } }
  );
}

export async function markStripeWebhookError(eventId: string, message: string) {
  await StripeWebhookEvent.updateOne(
    { stripeEventId: eventId },
    { $set: { status: "error", lastError: message } }
  );
}

export async function handleCheckoutSessionCompletedLike(checkoutSession: {
  id: string;
  payment_intent?: string | { id?: string } | null;
  metadata?: { tempOrderId?: string };
}) {
  const stripe = getStripeClient();
  const sessionId = checkoutSession.id;
  const paymentIntentId =
    typeof checkoutSession.payment_intent === "string"
      ? checkoutSession.payment_intent
      : checkoutSession.payment_intent?.id;

  const tempOrder = await TempOrder.findOneAndUpdate(
    {
      stripeSessionId: sessionId,
      status: { $in: ["created", "checkout_started", "paid", "finalizing"] },
    },
    {
      $set: {
        status: "paid",
        stripePaymentIntentId: paymentIntentId || undefined,
      },
    },
    { returnDocument: "after" }
  ).lean();

  const tempOrderId = tempOrder?._id?.toString() || checkoutSession.metadata?.tempOrderId;
  if (!tempOrderId) return;

  await confirmPendingReservationsForTempOrder(tempOrderId);

  try {
    await CheckoutFinalizationService.finalizeFromTempOrder(tempOrderId);
  } catch (finalizeError: any) {
    console.error("Stripe webhook finalization error:", finalizeError);
    await releaseReservationsForTempOrder(tempOrderId, { states: ["confirmed"] });
    await TempOrder.findByIdAndUpdate(tempOrderId, {
      $set: {
        status: "failed",
        lastError: finalizeError?.message || "Finalization failed",
      },
    });
    const latest = await TempOrder.findById(tempOrderId).lean();
    const pi = paymentIntentId || latest?.stripePaymentIntentId;
    if (pi) {
      try {
        await stripe.refunds.create({ payment_intent: pi as string });
      } catch (refundErr) {
        console.error("Stripe refund after finalize failure:", refundErr);
      }
    }
    throw finalizeError;
  }
}

export async function handleCheckoutSessionExpired(checkoutSession: { id: string }) {
  const sessionId = checkoutSession.id;
  const temp = await TempOrder.findOneAndUpdate(
    { stripeSessionId: sessionId, status: { $in: ["created", "checkout_started"] } },
    { $set: { status: "expired" } },
    { returnDocument: "after" }
  ).lean();
  if (temp?._id) {
    await releaseReservationsForTempOrder(temp._id.toString(), { states: ["pending"] });
  }
}

export async function handleCheckoutSessionAsyncPaymentFailed(checkoutSession: { id: string }) {
  const sessionId = checkoutSession.id;
  const temp = await TempOrder.findOne({ stripeSessionId: sessionId }).lean();
  if (temp?._id) {
    await releaseReservationsForTempOrder(temp._id.toString(), { states: ["pending"] });
    await TempOrder.findByIdAndUpdate(temp._id, {
      $set: { status: "failed", lastError: "Async payment failed" },
    });
  }
}

/**
 * Fires when Stripe cancels the underlying PaymentIntent (e.g. user abandons after PI creation).
 * Complements `checkout.session.expired` and `checkout.session.async_payment_failed`.
 */
export async function handlePaymentIntentCanceled(paymentIntent: {
  id: string;
  metadata?: Record<string, string> | null;
}) {
  const metaId = paymentIntent.metadata?.tempOrderId?.trim();
  const active = { $in: ["created", "checkout_started"] as const };

  let temp =
    metaId && mongoose.Types.ObjectId.isValid(metaId)
      ? await TempOrder.findOne({ _id: metaId, status: active }).lean()
      : null;
  if (!temp?._id) {
    temp = await TempOrder.findOne({
      stripePaymentIntentId: paymentIntent.id,
      status: active,
    }).lean();
  }
  if (!temp?._id) return;

  await releaseReservationsForTempOrder(temp._id.toString(), { states: ["pending"] });
  await TempOrder.findByIdAndUpdate(temp._id, {
    $set: { status: "failed", lastError: "Payment intent canceled" },
  });
}

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@wse/core/lib/db";
import {
  handleCheckoutSessionAsyncPaymentFailed,
  handleCheckoutSessionCompletedLike,
  handleCheckoutSessionExpired,
  handlePaymentIntentCanceled,
  markStripeWebhookError,
  markStripeWebhookProcessed,
  tryBeginStripeWebhook,
} from "@wse/core/services/stripe-webhook-handlers";
import "@wse/core/models/Reservation";
import "@wse/core/models/StripeWebhookEvent";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
    }

    const rawBody = await req.text();
    // Prefer tBook multi-tenant resolver (platform + per-org secrets). If the plugin
    // package is unavailable on a shop-only site, fall back to platform Stripe only.
    let event: import("stripe").Stripe.Event;
    let resolveOrgWebhook:
      | ((
          body: string,
          sig: string
        ) => Promise<{ event: import("stripe").Stripe.Event; organizationId: string | null }>)
      | null = null;
    try {
      const mod = await import("@wse/plugin-t-book/lib/org-integrations");
      resolveOrgWebhook = mod.resolveStripeWebhookSecretForSignature;
    } catch {
      resolveOrgWebhook = null;
    }

    if (resolveOrgWebhook) {
      ;({ event } = await resolveOrgWebhook(rawBody, signature));
    } else {
      const { getStripeClient, getStripeWebhookSecret } = await import("@wse/core/services/stripe");
      event = getStripeClient().webhooks.constructEvent(
        rawBody,
        signature,
        getStripeWebhookSecret()
      );
    }

    await dbConnect();

    const shouldProcess = await tryBeginStripeWebhook(event.id, event.type);
    if (!shouldProcess) {
      return NextResponse.json({ received: true });
    }

    try {
      switch (event.type) {
        case "checkout.session.completed":
        case "checkout.session.async_payment_succeeded": {
          const checkoutSession = event.data.object as any;
          if (
            checkoutSession.metadata?.checkoutKind === "camp_booking" ||
            checkoutSession.metadata?.campHoldId
          ) {
            const { CampCheckoutService } = await import(
              "@wse/plugin-camp-booking/services/checkout-service"
            );
            await CampCheckoutService.finalizeHoldFromStripeSession(checkoutSession);
          } else if (
            checkoutSession.metadata?.checkoutKind === "t_book" ||
            checkoutSession.metadata?.tBookBookingId
          ) {
            const { TBookCheckoutService } = await import(
              "@wse/plugin-t-book/services/checkout-service"
            );
            await TBookCheckoutService.finalizeBookingFromStripeSession(checkoutSession);
          } else {
            await handleCheckoutSessionCompletedLike(checkoutSession);
          }
          break;
        }
        case "checkout.session.expired": {
          const checkoutSession = event.data.object as any;
          if (
            checkoutSession.metadata?.checkoutKind === "t_book" ||
            checkoutSession.metadata?.tBookBookingId
          ) {
            const { TBookCheckoutService } = await import(
              "@wse/plugin-t-book/services/checkout-service"
            );
            await TBookCheckoutService.expireBooking(
              checkoutSession.metadata?.tBookBookingId || checkoutSession.client_reference_id || ""
            );
          } else {
            await handleCheckoutSessionExpired(checkoutSession);
          }
          break;
        }
        case "checkout.session.async_payment_failed": {
          const checkoutSession = event.data.object as any;
          await handleCheckoutSessionAsyncPaymentFailed(checkoutSession);
          break;
        }
        case "payment_intent.canceled": {
          const paymentIntent = event.data.object as any;
          await handlePaymentIntentCanceled(paymentIntent);
          break;
        }
        default:
          break;
      }
      await markStripeWebhookProcessed(event.id);
    } catch (handlerError: any) {
      console.error("Stripe webhook handler error:", handlerError);
      await markStripeWebhookError(event.id, handlerError?.message || String(handlerError));
      return NextResponse.json(
        { error: handlerError?.message || "Webhook handler error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json({ error: error.message || "Webhook error" }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { auth } from "@wse/core/auth";
import { resolveAuthenticatedUserId } from "@wse/core/lib/auth-session-user";
import dbConnect from "@wse/core/lib/db";
import TempOrder from "@wse/core/models/TempOrder";
import { FeatureFlagService } from "@wse/core/services/feature-flags";
import { applyCheckoutPriceAllocations, validateAndNormalizeCheckoutInput } from "@wse/core/services/checkout-validation";
import { getAppBaseUrl, getStripeClient } from "@wse/core/services/stripe";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import {
  allocateReservationsForStripeTempOrder,
  InventoryReservationError,
  releaseReservationsForTempOrder,
} from "@wse/core/services/inventory-reservation";
import { reservationEndsAt, resolveReservationTtlMs, stripeCheckoutExpiresAtUnix } from "@wse/core/services/reservation-ttl";
import "@wse/core/models/Reservation";
import { timeDevResponseMetric } from "@wse/core/lib/dev-metrics";

export const runtime = "nodejs";

function toStripeHufAmount(amount: number): number {
  return Math.max(1, Math.round(Number(amount || 0) * 100));
}

type StripeCheckoutLineItem = {
  quantity: number;
  price_data: {
    currency: "huf";
    unit_amount: number;
    product_data: {
      name: string;
      description?: string;
      metadata?: Record<string, string>;
    };
  };
};

export async function POST(req: NextRequest) {
  return timeDevResponseMetric("checkout.stripeSession.POST", async () => {
    const session = await auth();
    const checkoutUserId = await resolveAuthenticatedUserId(session);

    try {
      const commerceBlocked = shopCommerceBlockedResponse();
      if (commerceBlocked) return commerceBlocked;
      const isShopEnabled = await FeatureFlagService.isEnabled("shopPage", true);
      if (!isShopEnabled) {
        return NextResponse.json(
          { error: "Jelenleg a rendelés leadás szünetel" },
          { status: 503 }
        );
      }
      const stripeEnabled = await FeatureFlagService.isEnabled("stripePayments", false);
      if (!stripeEnabled) {
        return NextResponse.json(
          { error: "A Stripe fizetés jelenleg nem elérhető." },
          { status: 503 }
        );
      }

      const payload = await req.json();
      let validatedOrderData = await validateAndNormalizeCheckoutInput(payload, {
        userId: checkoutUserId ?? undefined,
        allowStripeFixed: true,
      });
      if (validatedOrderData.paymentProvider !== "stripe") {
        return NextResponse.json(
          { error: "A kiválasztott fizetési mód nem Stripe." },
          { status: 400 }
        );
      }

      await dbConnect();
      const now = new Date();
      const ttlMs = await resolveReservationTtlMs(null);
      const provisionalExpires = reservationEndsAt(now, ttlMs);

      const tempOrder = await TempOrder.create({
        user: checkoutUserId ? new mongoose.Types.ObjectId(checkoutUserId) : undefined,
        checkoutData: validatedOrderData,
        paymentProvider: "stripe",
        status: "created",
        expiresAt: provisionalExpires,
      });

      const reserveItems = validatedOrderData.items.map((item) => ({
        product: item.product,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      try {
        const { expiresAt, allocations } = await allocateReservationsForStripeTempOrder(tempOrder._id, reserveItems, {
          serverNow: now,
          requestedTtlMs: null,
        });
        validatedOrderData = applyCheckoutPriceAllocations(validatedOrderData, allocations);
        await TempOrder.findByIdAndUpdate(tempOrder._id, {
          $set: { checkoutData: validatedOrderData },
        });

        const stripe = getStripeClient();
        const baseUrl = getAppBaseUrl();
        const lineItems: StripeCheckoutLineItem[] = validatedOrderData.items.map((item) => ({
          quantity: item.quantity,
          price_data: {
            currency: "huf",
            unit_amount: toStripeHufAmount(Number(item.price || 0)),
            product_data: {
              name: item.name || "Termék",
              description: item.variantLabel || undefined,
              metadata: {
                vat_percent: String(item.vatPercent ?? 27),
              },
            },
          },
        }));
        if (validatedOrderData.shippingFee > 0) {
          lineItems.push({
            quantity: 1,
            price_data: {
              currency: "huf",
              unit_amount: toStripeHufAmount(validatedOrderData.shippingFee),
              product_data: {
                name: "Szállítás",
                description: undefined,
                metadata: {
                  line_kind: "shipping",
                  vat_percent: "27",
                },
              },
            },
          });
        }
        if (validatedOrderData.paymentFee > 0) {
          lineItems.push({
            quantity: 1,
            price_data: {
              currency: "huf",
              unit_amount: toStripeHufAmount(validatedOrderData.paymentFee),
              product_data: {
                name: "Fizetési kezelési díj",
                description: undefined,
                metadata: {
                  line_kind: "payment_fee",
                  vat_percent: "27",
                },
              },
            },
          });
        }

        const expiresAtUnix = stripeCheckoutExpiresAtUnix(now, expiresAt);

        const tempOrderIdStr = tempOrder._id.toString();
        const checkoutSession = await stripe.checkout.sessions.create({
          mode: "payment",
          success_url: `${baseUrl}/checkout/success?tempOrderId=${tempOrderIdStr}&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${baseUrl}/checkout?stripeCancelled=1`,
          client_reference_id: tempOrderIdStr,
          metadata: {
            tempOrderId: tempOrderIdStr,
            userId: checkoutUserId || "",
          },
          payment_intent_data: {
            metadata: {
              tempOrderId: tempOrderIdStr,
            },
          },
          line_items: lineItems,
          payment_method_types: ["card"],
          locale: "hu",
          expires_at: expiresAtUnix,
        });

        const paymentIntentId =
          typeof checkoutSession.payment_intent === "string"
            ? checkoutSession.payment_intent
            : checkoutSession.payment_intent?.id;

        await TempOrder.findByIdAndUpdate(tempOrder._id, {
          $set: {
            status: "checkout_started",
            stripeSessionId: checkoutSession.id,
            ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
            reservationExpiresAt: expiresAt,
            expiresAt,
          },
        });

        return NextResponse.json({
          success: true,
          checkoutUrl: checkoutSession.url,
          tempOrderId: tempOrder._id,
          reservationExpiresAt: expiresAt.toISOString(),
          serverTime: now.toISOString(),
        });
      } catch (inner: unknown) {
        await releaseReservationsForTempOrder(tempOrder._id.toString(), { states: ["pending"] });
        await TempOrder.deleteOne({ _id: tempOrder._id });
        if (inner instanceof InventoryReservationError) {
          return NextResponse.json(
            { error: inner.message },
            { status: inner.code === "INSUFFICIENT_STOCK" ? 409 : 400 }
          );
        }
        throw inner;
      }
    } catch (error: unknown) {
      console.error("Stripe session POST error:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Nem sikerült elindítani a Stripe fizetést." },
        { status: 400 }
      );
    }
  }, { category: "api", route: "/api/checkout/stripe/session", method: "POST", url: req.url });
}

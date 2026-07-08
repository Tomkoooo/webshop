import { NextRequest, NextResponse } from "next/server";
import { auth } from "@wse/core/auth";
import { resolveAuthenticatedUserId } from "@wse/core/lib/auth-session-user";
import { OrderService } from "@wse/core/services/order";
import { FeatureFlagService } from "@wse/core/services/feature-flags";
import {
  STRIPE_FIXED_PAYMENT_METHOD_ID,
  validateAndNormalizeCheckoutInput,
} from "@wse/core/services/checkout-validation";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { timeDevResponseMetric } from "@wse/core/lib/dev-metrics";

export async function POST(req: NextRequest) {
  return timeDevResponseMetric("checkout.order.POST", async () => {
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

      const payload = await req.json();
      if (payload?.paymentMethod === STRIPE_FIXED_PAYMENT_METHOD_ID) {
        return NextResponse.json(
          { error: "A Stripe fizetéshez a dedikált fizetési folyamatot kell használni." },
          { status: 400 }
        );
      }

      const validatedOrderData = await validateAndNormalizeCheckoutInput(payload, {
        userId: checkoutUserId ?? undefined,
        allowStripeFixed: false,
      });
      const order = await OrderService.createOrder(validatedOrderData, checkoutUserId ?? undefined);
      const orderId = String(order._id);

      return NextResponse.json({
        success: true,
        orderId,
        guestAccessToken: order.guestAccessToken ?? null,
      });
    } catch (error: unknown) {
      console.error("Order POST error:", error);
      return NextResponse.json({
        error: error instanceof Error ? error.message : "Internal Server Error"
      }, { status: 400 });
    }
  }, { category: "api", route: "/api/checkout/order", method: "POST", url: req.url });
}

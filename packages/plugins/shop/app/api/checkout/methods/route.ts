import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@wse/core/lib/db";
import ShippingMethod from "@wse/core/models/ShippingMethod";
import PaymentMethod from "@wse/core/models/PaymentMethod";
import { shopCommerceBlockedResponse } from "@wse/core/lib/features/shop";
import { FeatureFlagService } from "@wse/core/services/feature-flags";
import { resolveConfiguredGlsShippingMethod } from "@wse/core/services/gls-shipping";
import { resolveConfiguredFoxpostShippingMethod } from "@wse/core/services/foxpost-shipping";
import {
  isFoxpostParcelPickerEnabled,
  isGlsParcelPickerEnabled,
} from "@wse/core/lib/parcel-feature-flags";
import { getGlsShippingMethodName } from "@wse/core/services/gls-shipping";
import { getFoxpostShippingMethodName } from "@wse/core/services/foxpost-shipping";
import type { ShippingProviderKind } from "@wse/core/models/ShippingMethod";
import { timeDevResponseMetric } from "@wse/core/lib/dev-metrics";

type CheckoutMethodRow = {
  _id: { toString: () => string };
  name: string;
  grossPrice: number;
  isActive: boolean;
  provider?: ShippingProviderKind;
  descriptionHtml?: string;
};

type NormalizedShippingMethod = {
  _id: string;
  name: string;
  grossPrice: number;
  isActive: boolean;
  provider: ShippingProviderKind;
  isFixed: boolean;
  descriptionHtml?: string;
};

function isStripeEnvConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

function normalizeParcelRow(method: CheckoutMethodRow): NormalizedShippingMethod {
  const provider = method.provider === "foxpost" ? "foxpost" : "gls";
  return {
    _id: method._id.toString(),
    name: method.name,
    grossPrice: Number(method.grossPrice || 0),
    isActive: Boolean(method.isActive),
    provider,
    isFixed: false,
    descriptionHtml: String(method.descriptionHtml || "").trim() || undefined,
  };
}

export async function GET(_req: NextRequest) {
  return timeDevResponseMetric("checkout.methods.GET", async () => {
    try {
      const blocked = shopCommerceBlockedResponse();
      if (blocked) return blocked;
      const isShopEnabled = await FeatureFlagService.isEnabled("shopPage", true);
      const stripeEnabled = await FeatureFlagService.isEnabled("stripePayments", false);
      const [glsPickerEnabled, foxpostPickerEnabled] = await Promise.all([
        isGlsParcelPickerEnabled(),
        isFoxpostParcelPickerEnabled(),
      ]);
      if (!isShopEnabled) {
        return NextResponse.json(
          { error: "Jelenleg a rendelés leadás szünetel" },
          { status: 503 }
        );
      }

      await dbConnect();
      const [shippingMethods, paymentMethods] = await Promise.all([
        ShippingMethod.find({ isActive: true }).lean(),
        PaymentMethod.find({ isActive: true }).lean(),
      ]);

      const dbRows = shippingMethods as CheckoutMethodRow[];
      const parcelRows: NormalizedShippingMethod[] = [];
      const standardRows: NormalizedShippingMethod[] = [];

      for (const method of dbRows) {
        const provider = method.provider || "standard";

        if (provider === "gls" && glsPickerEnabled) {
          parcelRows.push(normalizeParcelRow(method));
          continue;
        }
        if (provider === "foxpost" && foxpostPickerEnabled) {
          parcelRows.push(normalizeParcelRow(method));
          continue;
        }
        if (provider === "gls" || provider === "foxpost") {
          continue;
        }

        if (glsPickerEnabled && method.name === getGlsShippingMethodName()) {
          continue;
        }
        if (foxpostPickerEnabled && method.name === getFoxpostShippingMethodName()) {
          continue;
        }

        standardRows.push({
          _id: method._id.toString(),
          name: method.name,
          grossPrice: Number(method.grossPrice || 0),
          isActive: Boolean(method.isActive),
          provider: "standard",
          isFixed: false,
          descriptionHtml: String(method.descriptionHtml || "").trim() || undefined,
        });
      }

      if (glsPickerEnabled && !parcelRows.some((m) => m.provider === "gls")) {
        const configuredGlsMethod = await resolveConfiguredGlsShippingMethod({ requireActive: true });
        if (configuredGlsMethod) {
          parcelRows.push({
            _id: configuredGlsMethod.id,
            name: configuredGlsMethod.name,
            grossPrice: configuredGlsMethod.grossPrice,
            isActive: true,
            provider: "gls",
            isFixed: false,
            descriptionHtml: configuredGlsMethod.descriptionHtml,
          });
        }
      }
      if (foxpostPickerEnabled && !parcelRows.some((m) => m.provider === "foxpost")) {
        const configuredFoxpostMethod = await resolveConfiguredFoxpostShippingMethod({
          requireActive: true,
        });
        if (configuredFoxpostMethod) {
          parcelRows.push({
            _id: configuredFoxpostMethod.id,
            name: configuredFoxpostMethod.name,
            grossPrice: configuredFoxpostMethod.grossPrice,
            isActive: true,
            provider: "foxpost",
            isFixed: false,
            descriptionHtml: configuredFoxpostMethod.descriptionHtml,
          });
        }
      }

      const normalizedShippingMethods = [...parcelRows, ...standardRows];

      const normalizedPaymentMethods = (paymentMethods as CheckoutMethodRow[]).map((method) => ({
        ...method,
        _id: method._id.toString(),
        provider: "standard",
        isFixed: false,
      }));

      if (stripeEnabled) {
        normalizedPaymentMethods.unshift({
          _id: "stripe_fixed",
          name: "Bankkártya (Stripe)",
          grossPrice: 0,
          isActive: true,
          provider: "stripe",
          isFixed: true,
        });
      }

      return NextResponse.json({
        shippingMethods: normalizedShippingMethods,
        paymentMethods: normalizedPaymentMethods,
        meta: {
          glsPickerEnabled,
          foxpostPickerEnabled,
          stripeEnabled,
          stripeConfigured: isStripeEnvConfigured(),
          parcelOnlyShipping: normalizedShippingMethods.every(
            (m) => m.provider === "gls" || m.provider === "foxpost"
          ),
        },
      });
    } catch (error) {
      console.error("Checkout methods GET error:", error);
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
  }, { category: "api", route: "/api/checkout/methods", method: "GET", url: _req.url });
}

/**
 * Tier B: hits real Stripe Checkout Session create + DB allocate (requires test API key).
 * Skipped unless RUN_STRIPE_RACE_TESTS is truthy (1 / true / yes) and STRIPE_SECRET_KEY is set.
 * `.env` is loaded via `import "dotenv/config"` in vitest.concurrency.config.ts (plain `vitest run` does not load .env).
 * Stripe CLI (`stripe listen`) is only needed if you assert webhook-delivered behavior; this file asserts HTTP + Mongo only.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "../setup/mongo-memory";
import { createJsonRequest } from "../helpers/next-request";
import Product from "@wse/core/models/Product";
import Reservation from "@wse/core/models/Reservation";
import ShippingMethod from "@wse/core/models/ShippingMethod";

function envFlagEnabled(value: string | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

/** Setup file loads `.env`; still need a test Stripe key (sk_test_… or sk_live_…). */
const runStripeRace = envFlagEnabled(process.env.RUN_STRIPE_RACE_TESTS) && Boolean(process.env.STRIPE_SECRET_KEY?.trim());

vi.mock("@wse/core/auth", () => ({
  auth: vi.fn(() =>
    Promise.resolve({ user: { id: new mongoose.Types.ObjectId().toString(), email: "race@test.local" } })
  ),
}));

vi.mock("@wse/core/services/feature-flags", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => true),
  },
}));

describe.skipIf(!runStripeRace)("stripe checkout session last-unit race (live Stripe test mode)", () => {
  let productId: string;
  let shippingMethodId: string;

  const billingInfo = {
    type: "personal" as const,
    name: "Race Tester",
    zip: "1011",
    city: "Budapest",
    street: "Test utca 1",
    email: "race@test.local",
    phone: "+3611111111",
  };
  const shippingAddress = { ...billingInfo, name: "Race Tester" };

  beforeAll(async () => {
    await connectTestDatabase();
  }, 120000);

  afterAll(async () => {
    await disconnectTestDatabase();
  }, 120000);

  beforeEach(async () => {
    await clearTestDatabase();
    const ship = await ShippingMethod.create({
      name: "Stripe race ship",
      grossPrice: 0,
      isActive: true,
    });
    shippingMethodId = ship._id.toString();

    const cat = new mongoose.Types.ObjectId();
    const p = await Product.create({
      name: "Stripe limited",
      images: [],
      description: "x",
      stock: 1,
      netPrice: 1000,
      discount: 0,
      category: cat,
      slug: `stripe-race-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      isActive: true,
      isVisible: true,
      variantOptions: [],
      variants: [],
      ratings: [],
    });
    productId = p._id.toString();
  });

  function checkoutBody() {
    return {
      items: [{ product: productId, quantity: 1 }],
      billingInfo,
      shippingAddress,
      shippingMethod: shippingMethodId,
      paymentMethod: "stripe_fixed",
      couponCodes: [],
    };
  }

  it("allows at most one concurrent POST /api/checkout/stripe/session when stock is 1", async () => {
    const attempts = 12;
    const { POST } = await import("@wse/core/app/api/checkout/stripe/session/route");

    const responses = await Promise.all(
      Array.from({ length: attempts }, () =>
        POST(createJsonRequest("http://localhost/api/checkout/stripe/session", "POST", checkoutBody()) as NextRequest)
      )
    );

    const bodies = await Promise.all(responses.map((r) => r.json()));
    const ok = responses.filter((r, i) => r.status === 200 && bodies[i]?.success === true);
    const conflict = responses.filter((r, i) => r.status === 409 && bodies[i]?.error);
    const other = responses.filter((r, i) => {
      const okRow = r.status === 200 && bodies[i]?.success === true;
      const c409 = r.status === 409 && bodies[i]?.error;
      return !okRow && !c409;
    });

    expect(other.length).toBe(0);
    expect(ok.length).toBe(1);
    expect(conflict.length).toBe(attempts - 1);

    const p = await Product.findById(productId).lean();
    expect(p?.stock).toBe(0);
    expect((p?.stock ?? 0) >= 0).toBe(true);
    expect(await Reservation.countDocuments({ state: "pending", product: productId })).toBe(1);
  });
});

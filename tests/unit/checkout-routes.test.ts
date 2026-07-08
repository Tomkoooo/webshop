import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createJsonRequest } from "../helpers/next-request";

const authMock = vi.fn();
const createOrderMock = vi.fn();
const validateCheckoutMock = vi.fn();
const featureFlagMock = vi.fn();
const dbConnectMock = vi.fn();
const tempOrderCreateMock = vi.fn();
const tempOrderUpdateMock = vi.fn();
const tempOrderDeleteOneMock = vi.fn();
const stripeSessionCreateMock = vi.fn();
const constructEventMock = vi.fn();

const webhookHandlers = vi.hoisted(() => ({
  tryBeginStripeWebhook: vi.fn().mockResolvedValue(true),
  markStripeWebhookProcessed: vi.fn().mockResolvedValue(undefined),
  markStripeWebhookError: vi.fn().mockResolvedValue(undefined),
  handleCheckoutSessionCompletedLike: vi.fn().mockResolvedValue(undefined),
  handleCheckoutSessionExpired: vi.fn().mockResolvedValue(undefined),
  handleCheckoutSessionAsyncPaymentFailed: vi.fn().mockResolvedValue(undefined),
  handlePaymentIntentCanceled: vi.fn().mockResolvedValue(undefined),
}));

const allocateReservationsMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    ttlMs: 30 * 60 * 1000,
    allocations: [],
  })
);
const releaseReservationsMock = vi.hoisted(() => vi.fn().mockResolvedValue(0));

vi.mock("@wse/core/auth", () => ({ auth: authMock }));
vi.mock("@wse/core/services/order", () => ({
  OrderService: {
    createOrder: createOrderMock,
  },
}));
vi.mock("@wse/core/services/checkout-validation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@wse/core/services/checkout-validation")>();
  return {
    ...actual,
    STRIPE_FIXED_PAYMENT_METHOD_ID: "stripe_fixed",
    validateAndNormalizeCheckoutInput: validateCheckoutMock,
  };
});
vi.mock("@wse/core/services/feature-flags", () => ({
  FeatureFlagService: {
    isEnabled: featureFlagMock,
  },
}));
vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/TempOrder", () => ({
  default: {
    create: tempOrderCreateMock,
    findByIdAndUpdate: tempOrderUpdateMock,
    deleteOne: tempOrderDeleteOneMock,
  },
}));
vi.mock("@wse/core/services/inventory-reservation", () => ({
  allocateReservationsForStripeTempOrder: allocateReservationsMock,
  releaseReservationsForTempOrder: releaseReservationsMock,
  InventoryReservationError: class InventoryReservationError extends Error {},
}));
vi.mock("@wse/core/services/stripe-webhook-handlers", () => webhookHandlers);
vi.mock("@wse/core/services/stripe", () => ({
  getStripeClient: () => ({
    checkout: { sessions: { create: stripeSessionCreateMock } },
    webhooks: { constructEvent: constructEventMock },
  }),
  getAppBaseUrl: () => "http://localhost:3000",
  getStripeWebhookSecret: () => "secret",
}));
vi.mock("@wse/core/services/reservation-ttl", () => ({
  resolveReservationTtlMs: vi.fn().mockResolvedValue(30 * 60 * 1000),
  reservationEndsAt: (_now: Date, ttlMs: number) => new Date(Date.now() + ttlMs),
  stripeCheckoutExpiresAtUnix: () => Math.floor(Date.now() / 1000) + 1800,
}));

describe("checkout and payment routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "507f1f77bcf86cd799439011" } });
    featureFlagMock.mockResolvedValue(true);
    validateCheckoutMock.mockResolvedValue({
      items: [
        {
          product: "507f1f77bcf86cd799439012",
          quantity: 1,
          price: 1000,
          name: "Termek",
        },
      ],
      shippingFee: 100,
      paymentFee: 50,
      paymentProvider: "stripe",
    });
    createOrderMock.mockResolvedValue({ _id: "o1" });
    tempOrderCreateMock.mockResolvedValue({ _id: { toString: () => "tmp1" } });
    stripeSessionCreateMock.mockResolvedValue({
      id: "sess1",
      url: "https://stripe.local",
      payment_intent: "pi_sess1",
    });
    tempOrderUpdateMock.mockResolvedValue({});
    constructEventMock.mockReturnValue({
      id: "evt_1",
      type: "checkout.session.completed",
      data: { object: { id: "sess1", payment_intent: "pi_1", metadata: { tempOrderId: "tmp1" } } },
    });
  });

  it("creates standard order via checkout/order route", async () => {
    const { POST } = await import("@wse/core/app/api/checkout/order/route");
    const req = createJsonRequest("http://localhost/api/checkout/order", "POST", {
      paymentMethod: "pm1",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(validateCheckoutMock).toHaveBeenCalled();
    expect(createOrderMock).toHaveBeenCalled();
  });

  it("rejects stripe fixed payment on standard order route", async () => {
    const { POST } = await import("@wse/core/app/api/checkout/order/route");
    const req = createJsonRequest("http://localhost/api/checkout/order", "POST", {
      paymentMethod: "stripe_fixed",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("creates stripe checkout session", async () => {
    const { POST } = await import("@wse/core/app/api/checkout/stripe/session/route");
    const req = createJsonRequest("http://localhost/api/checkout/stripe/session", "POST", {
      paymentMethod: "stripe_fixed",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.checkoutUrl).toBe("https://stripe.local");
    expect(stripeSessionCreateMock).toHaveBeenCalled();
    expect(stripeSessionCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payment_intent_data: {
          metadata: expect.objectContaining({ tempOrderId: "tmp1" }),
        },
        expires_at: expect.any(Number),
        line_items: [
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 100000 }),
          }),
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 10000 }),
          }),
          expect.objectContaining({
            price_data: expect.objectContaining({ unit_amount: 5000 }),
          }),
        ],
      })
    );
    expect(allocateReservationsMock).toHaveBeenCalled();
    expect(tempOrderUpdateMock).toHaveBeenCalled();
  });

  it("returns 503 when stripe feature disabled", async () => {
    featureFlagMock.mockImplementation(async (key: string) => key !== "stripePayments");
    const { POST } = await import("@wse/core/app/api/checkout/stripe/session/route");
    const req = createJsonRequest("http://localhost/api/checkout/stripe/session", "POST", {});
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("rejects stripe session when provider is not stripe", async () => {
    validateCheckoutMock.mockResolvedValueOnce({
      items: [],
      shippingFee: 0,
      paymentFee: 0,
      paymentProvider: "standard",
    });
    const { POST } = await import("@wse/core/app/api/checkout/stripe/session/route");
    const req = createJsonRequest("http://localhost/api/checkout/stripe/session", "POST", {});
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles stripe webhook and triggers finalization", async () => {
    const { POST } = await import("@wse/core/app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }) as unknown as NextRequest;

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.received).toBe(true);
    expect(webhookHandlers.handleCheckoutSessionCompletedLike).toHaveBeenCalled();
    expect(webhookHandlers.markStripeWebhookProcessed).toHaveBeenCalledWith("evt_1");
  });

  it("handles missing stripe signature", async () => {
    const { POST } = await import("@wse/core/app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    }) as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 503 when shop is disabled on order route", async () => {
    featureFlagMock.mockImplementation(async (key: string) => key !== "shopPage");
    const { POST } = await import("@wse/core/app/api/checkout/order/route");
    const req = createJsonRequest("http://localhost/api/checkout/order", "POST", {
      paymentMethod: "pm1",
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("returns 400 on order route exception", async () => {
    validateCheckoutMock.mockRejectedValue(new Error("bad"));
    const { POST } = await import("@wse/core/app/api/checkout/order/route");
    const req = createJsonRequest("http://localhost/api/checkout/order", "POST", {
      paymentMethod: "pm1",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("handles expired webhook event", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_exp",
      type: "checkout.session.expired",
      data: { object: { id: "sess-exp" } },
    });
    const { POST } = await import("@wse/core/app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }) as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(webhookHandlers.handleCheckoutSessionExpired).toHaveBeenCalled();
  });

  it("handles payment_intent.canceled webhook event", async () => {
    constructEventMock.mockReturnValue({
      id: "evt_pi_cancel",
      type: "payment_intent.canceled",
      data: { object: { id: "pi_1", metadata: { tempOrderId: "tmp1" } } },
    });
    const { POST } = await import("@wse/core/app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }) as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(webhookHandlers.handlePaymentIntentCanceled).toHaveBeenCalled();
    expect(webhookHandlers.markStripeWebhookProcessed).toHaveBeenCalledWith("evt_pi_cancel");
  });

  it("returns webhook error when signature construction fails", async () => {
    constructEventMock.mockImplementationOnce(() => {
      throw new Error("invalid signature");
    });
    const { POST } = await import("@wse/core/app/api/stripe/webhook/route");
    const req = new Request("http://localhost/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "sig" },
      body: "{}",
    }) as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

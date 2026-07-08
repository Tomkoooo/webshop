import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const dbConnectMock = vi.fn();
const findByIdMock = vi.fn();
const findOneAndUpdateMock = vi.fn();
const retrieveMock = vi.fn();
const finalizeMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/TempOrder", () => ({
  default: {
    findById: findByIdMock,
    findOneAndUpdate: findOneAndUpdateMock,
  },
}));
vi.mock("@wse/core/services/stripe", () => ({
  getStripeClient: () => ({
    checkout: {
      sessions: {
        retrieve: retrieveMock,
      },
    },
  }),
}));
vi.mock("@wse/core/services/checkout-finalization", () => ({
  CheckoutFinalizationService: {
    finalizeFromTempOrder: finalizeMock,
  },
}));
vi.mock("@wse/core/services/inventory-reservation", () => ({
  confirmPendingReservationsForTempOrder: vi.fn().mockResolvedValue(undefined),
}));

describe("GET /api/checkout/stripe/status", () => {
  const tempOid = "507f1f77bcf86cd799439011";
  const sessionId = "cs_test_xyz";

  beforeEach(() => {
    findByIdMock.mockReset();
    vi.clearAllMocks();
    dbConnectMock.mockResolvedValue(undefined);
    findOneAndUpdateMock.mockResolvedValue({});
    finalizeMock.mockResolvedValue({ status: "finalized", order: { _id: "order1" } });
  });

  it("returns finalized order when temp order already completed", async () => {
    findByIdMock.mockReturnValueOnce({
      lean: vi.fn().mockResolvedValue({
        stripeSessionId: sessionId,
        status: "finalized",
        finalizedOrderId: { toString: () => "orderfinal" },
      }),
    });

    const { GET } = await import("@wse/plugin-shop/app/api/checkout/stripe/status/route");
    const req = new NextRequest(
      `http://localhost/api/checkout/stripe/status?tempOrderId=${tempOid}&session_id=${sessionId}`
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.finalized).toBe(true);
    expect(body.orderId).toBe("orderfinal");
    expect(retrieveMock).not.toHaveBeenCalled();
  });

  it("verifies Stripe session, marks paid, and finalizes", async () => {
    findByIdMock
      .mockReturnValueOnce({
        lean: async () => ({
          _id: tempOid,
          stripeSessionId: sessionId,
          status: "checkout_started",
          checkoutData: {},
        }),
      })
      .mockReturnValueOnce({
        lean: async () => ({
          status: "finalized",
          finalizedOrderId: { toString: () => "realorder" },
        }),
      });

    retrieveMock.mockResolvedValue({
      id: sessionId,
      payment_status: "paid",
      payment_intent: "pi_123",
      metadata: { tempOrderId: tempOid },
      client_reference_id: tempOid,
    });

    const { GET } = await import("@wse/plugin-shop/app/api/checkout/stripe/status/route");
    const req = new NextRequest(
      `http://localhost/api/checkout/stripe/status?tempOrderId=${tempOid}&session_id=${sessionId}`
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(retrieveMock).toHaveBeenCalledWith(sessionId);
    expect(findOneAndUpdateMock).toHaveBeenCalled();
    expect(finalizeMock).toHaveBeenCalledWith(tempOid);
    expect(body.finalized).toBe(true);
    expect(body.orderId).toBe("realorder");
  });

  it("returns payment pending when Stripe session not paid yet", async () => {
    findByIdMock.mockReturnValue({
      lean: async () => ({
        stripeSessionId: sessionId,
        status: "checkout_started",
        checkoutData: {},
      }),
    });
    retrieveMock.mockResolvedValue({
      id: sessionId,
      payment_status: "unpaid",
      metadata: { tempOrderId: tempOid },
      client_reference_id: tempOid,
    });

    const { GET } = await import("@wse/plugin-shop/app/api/checkout/stripe/status/route");
    const req = new NextRequest(
      `http://localhost/api/checkout/stripe/status?tempOrderId=${tempOid}&session_id=${sessionId}`
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paymentPending).toBe(true);
    expect(body.finalized).toBe(false);
    expect(finalizeMock).not.toHaveBeenCalled();
  });

  it("rejects mismatched Stripe session binding", async () => {
    findByIdMock.mockReturnValue({
      lean: async () => ({
        stripeSessionId: sessionId,
        status: "checkout_started",
      }),
    });
    retrieveMock.mockResolvedValue({
      id: sessionId,
      payment_status: "paid",
      metadata: { tempOrderId: "otherid" },
      client_reference_id: "otherid",
    });

    const { GET } = await import("@wse/plugin-shop/app/api/checkout/stripe/status/route");
    const req = new NextRequest(
      `http://localhost/api/checkout/stripe/status?tempOrderId=${tempOid}&session_id=${sessionId}`
    );
    const res = await GET(req);

    expect(res.status).toBe(400);
  });
});

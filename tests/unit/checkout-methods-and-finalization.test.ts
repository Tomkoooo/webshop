import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const dbConnectMock = vi.fn();
const shippingFindMock = vi.fn();
const paymentFindMock = vi.fn();
const featureFlagMock = vi.fn();
const resolveGlsMethodMock = vi.fn();
const resolveFoxpostMethodMock = vi.fn();

const tempFindByIdMock = vi.fn();
const tempFindOneAndUpdateMock = vi.fn();
const tempFindByIdAndUpdateMock = vi.fn();
const orderFindByIdMock = vi.fn();
const createOrderFromCheckoutDataMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/ShippingMethod", () => ({ default: { find: shippingFindMock } }));
vi.mock("@wse/core/models/PaymentMethod", () => ({ default: { find: paymentFindMock } }));
vi.mock("@wse/core/services/feature-flags", () => ({
  FeatureFlagService: { isEnabled: featureFlagMock },
}));
vi.mock("@wse/core/services/gls-shipping", () => ({
  getGlsShippingMethodName: () => "GLS Csomagpont",
  resolveConfiguredGlsShippingMethod: resolveGlsMethodMock,
}));
vi.mock("@wse/core/services/foxpost-shipping", () => ({
  getFoxpostShippingMethodName: () => "Foxpost Csomagautomata",
  resolveConfiguredFoxpostShippingMethod: resolveFoxpostMethodMock,
}));

vi.mock("@wse/core/models/TempOrder", () => ({
  default: {
    findById: tempFindByIdMock,
    findOneAndUpdate: tempFindOneAndUpdateMock,
    findByIdAndUpdate: tempFindByIdAndUpdateMock,
  },
}));
vi.mock("@wse/core/models/Order", () => ({ default: { findById: orderFindByIdMock } }));
vi.mock("@wse/core/services/order", () => ({
  OrderService: { createOrderFromCheckoutData: createOrderFromCheckoutDataMock },
}));

describe("checkout methods and finalization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    featureFlagMock.mockImplementation(async (key: string) => {
      if (key === "shopPage") return true;
      if (key === "stripePayments") return true;
      if (key === "glsParcelPicker" || key === "foxpostParcelPicker") return true;
      return false;
    });
    shippingFindMock.mockReturnValue({
      lean: async () => [
        { _id: { toString: () => "ship1" }, name: "Hazhoz", grossPrice: 990, isActive: true, provider: "standard" },
        {
          _id: { toString: () => "ship_gls" },
          name: "GLS Csomagpont",
          grossPrice: 1490,
          isActive: true,
          provider: "gls",
        },
        {
          _id: { toString: () => "ship_fox" },
          name: "Foxpost Csomagautomata",
          grossPrice: 1290,
          isActive: true,
          provider: "foxpost",
        },
      ],
    });
    paymentFindMock.mockReturnValue({
      lean: async () => [{ _id: { toString: () => "pay1" }, name: "Utalas", grossPrice: 0, isActive: true }],
    });
    resolveGlsMethodMock.mockResolvedValue({ id: "ship_gls", name: "GLS Csomagpont", grossPrice: 1490 });
    resolveFoxpostMethodMock.mockResolvedValue({
      id: "ship_fox",
      name: "Foxpost Csomagautomata",
      grossPrice: 1290,
    });
  });

  it("returns normalized methods with fixed stripe and gls options", async () => {
    const { GET } = await import("@wse/core/app/api/checkout/methods/route");
    const req = new NextRequest("http://localhost/api/checkout/methods");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    const shippingIds = body.shippingMethods.map((m: { _id: string }) => m._id);
    expect(shippingIds).toContain("ship_gls");
    expect(shippingIds).toContain("ship_fox");
    expect(shippingIds).not.toContain("gls_fixed");
    expect(shippingIds).not.toContain("foxpost_fixed");
    const gls = body.shippingMethods.find((m: { _id: string }) => m._id === "ship_gls");
    expect(gls.grossPrice).toBe(1490);
    expect(gls.provider).toBe("gls");
    expect(body.paymentMethods[0]._id).toBe("stripe_fixed");
  });

  it("finalizes temp order and marks status", async () => {
    const tempId = "507f1f77bcf86cd799439011";
    tempFindByIdMock
      .mockReturnValueOnce({ lean: async () => ({ _id: tempId, status: "paid", checkoutData: { items: [] }, user: { toString: () => "u1" } }) })
      .mockReturnValueOnce({ lean: async () => null });
    tempFindOneAndUpdateMock.mockResolvedValue({
      _id: tempId,
      checkoutData: { items: [] },
      user: { toString: () => "u1" },
    });
    createOrderFromCheckoutDataMock.mockResolvedValue({ _id: "order1" });

    const { CheckoutFinalizationService } = await import("@wse/core/services/checkout-finalization");
    const result = await CheckoutFinalizationService.finalizeFromTempOrder(tempId);

    expect(result.status).toBe("finalized");
    expect(tempFindByIdAndUpdateMock).toHaveBeenCalled();
    expect(createOrderFromCheckoutDataMock).toHaveBeenCalledWith(
      expect.any(Object),
      "u1",
      expect.objectContaining({ enforceShopEnabled: false, skipStockDecrement: true })
    );
  });

  it("returns 503 when shop is disabled in methods route", async () => {
    featureFlagMock.mockImplementation(async (key: string) => key !== "shopPage");
    const { GET } = await import("@wse/core/app/api/checkout/methods/route");
    const req = new NextRequest("http://localhost/api/checkout/methods");
    const res = await GET(req);
    expect(res.status).toBe(503);
  });

  it("handles invalid temp order id", async () => {
    const { CheckoutFinalizationService } = await import("@wse/core/services/checkout-finalization");
    await expect(CheckoutFinalizationService.finalizeFromTempOrder("bad-id")).rejects.toThrow(
      "Érvénytelen ideiglenes rendelés azonosító"
    );
  });

  it("returns 500 when methods route throws", async () => {
    shippingFindMock.mockImplementationOnce(() => {
      throw new Error("db boom");
    });
    const { GET } = await import("@wse/core/app/api/checkout/methods/route");
    const req = new NextRequest("http://localhost/api/checkout/methods");
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

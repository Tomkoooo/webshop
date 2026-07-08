import { beforeEach, describe, expect, it, vi } from "vitest";

const dbConnectMock = vi.fn();
const tempFindByIdMock = vi.fn();
const tempFindOneAndUpdateMock = vi.fn();
const tempFindByIdAndUpdateMock = vi.fn();
const orderFindByIdMock = vi.fn();
const createOrderFromCheckoutDataMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
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

describe("CheckoutFinalizationService branch coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws when temp order does not exist", async () => {
    tempFindByIdMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    const { CheckoutFinalizationService } = await import("@wse/core/services/checkout-finalization");
    await expect(
      CheckoutFinalizationService.finalizeFromTempOrder("507f1f77bcf86cd799439011")
    ).rejects.toThrow("Az ideiglenes rendelés nem található");
  });

  it("returns already finalized order", async () => {
    tempFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "t1",
        status: "finalized",
        finalizedOrderId: "o1",
      }),
    });
    orderFindByIdMock.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "o1" }) });

    const { CheckoutFinalizationService } = await import("@wse/core/services/checkout-finalization");
    const result = await CheckoutFinalizationService.finalizeFromTempOrder("507f1f77bcf86cd799439011");
    expect(result.status).toBe("finalized");
  });

  it("handles lock miss and returns latest status", async () => {
    tempFindByIdMock
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: "t1", status: "paid" }) })
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: "t1", status: "paid" }) });
    tempFindOneAndUpdateMock.mockResolvedValue(null);
    const { CheckoutFinalizationService } = await import("@wse/core/services/checkout-finalization");
    const result = await CheckoutFinalizationService.finalizeFromTempOrder("507f1f77bcf86cd799439011");
    expect(result.status).toBe("paid");
  });

  it("returns latest finalized order when lock misses but order finalized", async () => {
    tempFindByIdMock
      .mockReturnValueOnce({ lean: vi.fn().mockResolvedValue({ _id: "t1", status: "paid" }) })
      .mockReturnValueOnce({
        lean: vi.fn().mockResolvedValue({ _id: "t1", status: "finalized", finalizedOrderId: "o1" }),
      });
    tempFindOneAndUpdateMock.mockResolvedValue(null);
    orderFindByIdMock.mockReturnValue({ lean: vi.fn().mockResolvedValue({ _id: "o1" }) });

    const { CheckoutFinalizationService } = await import("@wse/core/services/checkout-finalization");
    const result = await CheckoutFinalizationService.finalizeFromTempOrder("507f1f77bcf86cd799439011");
    expect(result.status).toBe("finalized");
  });

  it("restores paid state when order creation fails", async () => {
    tempFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({
        _id: "t1",
        status: "paid",
      }),
    });
    tempFindOneAndUpdateMock.mockResolvedValue({
      _id: "t1",
      checkoutData: {},
    });
    createOrderFromCheckoutDataMock.mockRejectedValue(new Error("boom"));

    const { CheckoutFinalizationService } = await import("@wse/core/services/checkout-finalization");
    await expect(
      CheckoutFinalizationService.finalizeFromTempOrder("507f1f77bcf86cd799439011")
    ).rejects.toThrow("boom");
    expect(tempFindByIdAndUpdateMock).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({
        $set: expect.objectContaining({ status: "paid" }),
      })
    );
  });
});

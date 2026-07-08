import { beforeEach, describe, expect, it, vi } from "vitest";

const dbConnectMock = vi.fn();
const orderFindByIdMock = vi.fn();
const orderSaveMock = vi.fn();
const tempOrderFindOneMock = vi.fn();
const reverseInvoiceMock = vi.fn();
const downloadInvoicePdfMock = vi.fn();
const releaseReservationsMock = vi.fn();
const restoreCheckoutLineStockMock = vi.fn();
const stripeRefundsListMock = vi.fn();
const stripeRefundsCreateMock = vi.fn();
const mailerSendMock = vi.fn();
const createMissingTemplateMock = vi.fn();
const buildCoreEmailTemplateSeedsMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/Order", () => ({
  default: { findById: (...args: unknown[]) => orderFindByIdMock(...args) },
}));
vi.mock("@wse/core/models/TempOrder", () => ({
  default: { findOne: (...args: unknown[]) => tempOrderFindOneMock(...args) },
}));
vi.mock("@wse/core/services/invoicing-szamlazz", () => ({
  InvoicingSzamlazzService: {
    reverseInvoice: (...args: unknown[]) => reverseInvoiceMock(...args),
    downloadInvoicePdf: (...args: unknown[]) => downloadInvoicePdfMock(...args),
  },
}));
vi.mock("@wse/core/services/email-template", () => ({
  EmailTemplateService: {
    createMissing: (...args: unknown[]) => createMissingTemplateMock(...args),
  },
}));
vi.mock("@wse/core/lib/email-template-catalog", () => ({
  buildCoreEmailTemplateSeeds: (...args: unknown[]) => buildCoreEmailTemplateSeedsMock(...args),
}));
vi.mock("@wse/core/services/inventory-reservation", () => ({
  releaseReservationsForTempOrder: (...args: unknown[]) => releaseReservationsMock(...args),
  restoreCheckoutLineStock: (...args: unknown[]) => restoreCheckoutLineStockMock(...args),
}));
vi.mock("@wse/core/services/mailer", () => ({
  MailerService: { sendEmail: (...args: unknown[]) => mailerSendMock(...args) },
}));
vi.mock("@wse/core/services/stripe", () => ({
  getStripeClient: () => ({
    refunds: {
      list: (...args: unknown[]) => stripeRefundsListMock(...args),
      create: (...args: unknown[]) => stripeRefundsCreateMock(...args),
    },
  }),
}));

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    status: "processing",
    items: [{ product: "prod1", quantity: 2 }],
    billingInfo: { email: "buyer@test.hu" },
    shippingAddress: { name: "Buyer" },
    invoiceId: "INV-2024-001",
    invoiceStatus: "issued",
    populate: vi.fn().mockResolvedValue(undefined),
    save: orderSaveMock,
    ...overrides,
  };
}

describe("OrderCancellationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbConnectMock.mockResolvedValue(undefined);
    orderSaveMock.mockResolvedValue(undefined);
    mailerSendMock.mockResolvedValue(undefined);
    tempOrderFindOneMock.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue({
        _id: { toString: () => "temp1" },
        stripePaymentIntentId: "pi_123",
      }),
    }));
    stripeRefundsListMock.mockResolvedValue({ data: [] });
    stripeRefundsCreateMock.mockResolvedValue({ id: "re_123" });
    reverseInvoiceMock.mockResolvedValue({ invoiceId: "STORNO-001" });
    downloadInvoicePdfMock.mockResolvedValue(Buffer.from("pdf"));
    releaseReservationsMock.mockResolvedValue(2);
    createMissingTemplateMock.mockResolvedValue(undefined);
    buildCoreEmailTemplateSeedsMock.mockResolvedValue([
      { type: "order_status_change", subject: "status", body: "status" },
      { type: "order_cancelled", subject: "cancelled", body: "cancelled" },
    ]);
  });

  it("refunds stripe, reverses invoice, restores stock, and cancels order", async () => {
    const order = makeOrder();
    orderFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue(order),
    });

    const { OrderCancellationService } = await import("@wse/core/services/order-cancellation");
    const result = await OrderCancellationService.cancel("507f1f77bcf86cd799439011");

    expect(result).toEqual({
      success: true,
      refunded: true,
      refundId: "re_123",
      invoiceReversed: true,
      reversalInvoiceId: "STORNO-001",
      stockRestored: true,
    });
    expect(stripeRefundsCreateMock).toHaveBeenCalledWith({ payment_intent: "pi_123" });
    expect(reverseInvoiceMock).toHaveBeenCalledWith("INV-2024-001");
    expect(releaseReservationsMock).toHaveBeenCalledWith("temp1", { states: ["confirmed"] });
    expect(order.status).toBe("cancelled");
    expect(order.invoiceStatus).toBe("reversed");
    expect(order.stripeRefundId).toBe("re_123");
    expect(order.invoiceReversalId).toBe("STORNO-001");
    expect(orderSaveMock).toHaveBeenCalled();
    expect(mailerSendMock).toHaveBeenCalledTimes(2);
    expect(mailerSendMock).toHaveBeenCalledWith(
      expect.objectContaining({ templateType: "order_status_change" })
    );
    expect(mailerSendMock).toHaveBeenCalledWith(
      expect.objectContaining({ templateType: "order_cancelled" })
    );
    expect(downloadInvoicePdfMock).toHaveBeenCalledWith(
      expect.objectContaining({ invoiceId: "STORNO-001" })
    );
    expect(mailerSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateType: "order_cancelled",
        attachments: [
          expect.objectContaining({
            filename: "STORNO-001.pdf",
            contentType: "application/pdf",
          }),
        ],
      })
    );
    expect(createMissingTemplateMock).toHaveBeenCalledTimes(2);
  });

  it("stores optional cancellation reason and includes it in emails", async () => {
    const order = makeOrder();
    orderFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue(order),
    });

    const { OrderCancellationService } = await import("@wse/core/services/order-cancellation");
    await OrderCancellationService.cancel("507f1f77bcf86cd799439011", {
      reason: "  Hibás szállítási cím  ",
    });

    expect(order.cancellationReason).toBe("Hibás szállítási cím");
    expect(mailerSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        templateType: "order_cancelled",
        data: expect.objectContaining({ cancellationReason: "Hibás szállítási cím" }),
      })
    );
  });

  it("rejects already cancelled orders", async () => {
    orderFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue(makeOrder({ status: "cancelled" })),
    });

    const { OrderCancellationService } = await import("@wse/core/services/order-cancellation");
    await expect(OrderCancellationService.cancel("507f1f77bcf86cd799439011")).rejects.toThrow(
      "már törölve"
    );
  });

  it("skips stripe refund and invoice storno when not applicable", async () => {
    const order = makeOrder({
      invoiceId: undefined,
      invoiceStatus: "pending",
    });
    orderFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue(order),
    });
    tempOrderFindOneMock.mockImplementation(() => ({
      lean: vi.fn().mockResolvedValue(null),
    }));

    const { OrderCancellationService } = await import("@wse/core/services/order-cancellation");
    const result = await OrderCancellationService.cancel("507f1f77bcf86cd799439011");

    expect(result.refunded).toBe(false);
    expect(result.invoiceReversed).toBe(false);
    expect(stripeRefundsCreateMock).not.toHaveBeenCalled();
    expect(reverseInvoiceMock).not.toHaveBeenCalled();
    expect(restoreCheckoutLineStockMock).toHaveBeenCalledWith({
      product: "prod1",
      variantId: undefined,
      quantity: 2,
    });
    expect(mailerSendMock).toHaveBeenCalledTimes(2);
  });
});

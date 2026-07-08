import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveInvoiceErrorAlertEmailsMock = vi.fn();
const findByIdChain = {
  populate: vi.fn().mockReturnThis(),
  lean: vi.fn(),
};
const orderFindByIdMock = vi.fn(() => findByIdChain);
const sendSystemHtmlEmailMock = vi.fn();

vi.mock("@wse/core/models/Order", () => ({
  default: { findById: orderFindByIdMock },
}));
vi.mock("@wse/core/services/shop-ops-alert-email", () => ({
  resolveInvoiceErrorAlertEmails: () => resolveInvoiceErrorAlertEmailsMock(),
}));
vi.mock("@wse/core/services/mailer", () => ({
  MailerService: { sendSystemHtmlEmail: sendSystemHtmlEmailMock },
}));

describe("sendInvoiceErrorShopAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveInvoiceErrorAlertEmailsMock.mockResolvedValue(["ops@shop.test"]);
    sendSystemHtmlEmailMock.mockResolvedValue({ messageId: "x" });
    delete process.env.INVOICE_ERROR_ALERT_EMAIL;
  });

  it("sends INVOICE ERROR to shop contact_email with order and error context", async () => {
    findByIdChain.lean.mockResolvedValue({
      _id: "507f1f77bcf86cd799439011",
      invoiceLastError: "API down",
      billingInfo: {
        type: "company",
        name: "Acme Kft",
        taxNumber: "12345678-1-41",
        email: "billing@acme.test",
        phone: "+361",
        zip: "1111",
        city: "Bp",
        street: "Utca 1",
      },
      shippingAddress: {
        name: "Ship Name",
        email: "ship@test.hu",
        phone: "+362",
        zip: "2222",
        city: "Deb",
        street: "Other 2",
      },
      items: [{ name: "Tool", quantity: 2, price: 1500, variantLabel: "Red" }],
      subtotal: 3000,
      shippingFee: 500,
      paymentFee: 0,
      discount: 0,
      total: 3500,
      paymentMethod: { name: "Card" },
      shippingMethod: { name: "GLS" },
      user: { email: "u@test.hu", name: "User" },
    });

    const { sendInvoiceErrorShopAlert } = await import("@wse/core/services/invoice-error-alert");
    await sendInvoiceErrorShopAlert("507f1f77bcf86cd799439011", new Error("Számlázz timeout"));

    expect(sendSystemHtmlEmailMock).toHaveBeenCalledTimes(1);
    const arg = sendSystemHtmlEmailMock.mock.calls[0][0];
    expect(arg.to).toBe("ops@shop.test");
    expect(arg.subject).toBe("INVOICE ERROR");
    expect(arg.html).toContain("Számlázz timeout");
    expect(arg.html).toContain("507f1f77bcf86cd799439011");
    expect(arg.html).toContain("Acme Kft");
    expect(arg.text).toContain("Számlázz timeout");
    expect(arg.text).toContain("billing@acme.test");
  });

  it("sends to all configured invoice alert recipients", async () => {
    resolveInvoiceErrorAlertEmailsMock.mockResolvedValue([
      "inv1@shop.test",
      "inv2@shop.test",
    ]);
    findByIdChain.lean.mockResolvedValue({
      _id: "o1",
      billingInfo: { name: "B", email: "b@test", zip: "1", city: "c", street: "s" },
      shippingAddress: { name: "S", email: "s@test", zip: "1", city: "c", street: "x" },
      items: [],
    });

    const { sendInvoiceErrorShopAlert } = await import("@wse/core/services/invoice-error-alert");
    await sendInvoiceErrorShopAlert("o1", new Error("x"));

    expect(sendSystemHtmlEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "inv1@shop.test, inv2@shop.test" })
    );
  });

  it("uses resolved ops email from env/CMS path (fallback inbox)", async () => {
    resolveInvoiceErrorAlertEmailsMock.mockResolvedValue(["fallback@shop.test"]);
    findByIdChain.lean.mockResolvedValue({
      _id: "o1",
      billingInfo: { name: "B", email: "b@test", zip: "1", city: "c", street: "s" },
      shippingAddress: { name: "S", email: "s@test", zip: "1", city: "c", street: "x" },
      items: [],
    });

    const { sendInvoiceErrorShopAlert } = await import("@wse/core/services/invoice-error-alert");
    await sendInvoiceErrorShopAlert("o1", new Error("x"));

    expect(sendSystemHtmlEmailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: "fallback@shop.test" })
    );
  });

  it("skips send when no recipient is configured", async () => {
    resolveInvoiceErrorAlertEmailsMock.mockResolvedValue([]);
    findByIdChain.lean.mockResolvedValue({ _id: "o1", billingInfo: {}, shippingAddress: {}, items: [] });

    const { sendInvoiceErrorShopAlert } = await import("@wse/core/services/invoice-error-alert");
    await sendInvoiceErrorShopAlert("o1", new Error("x"));

    expect(sendSystemHtmlEmailMock).not.toHaveBeenCalled();
  });
});

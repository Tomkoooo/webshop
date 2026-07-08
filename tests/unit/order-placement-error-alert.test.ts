import { beforeEach, describe, expect, it, vi } from "vitest";

const resolveShopOpsAlertEmailMock = vi.fn();
const sendSystemHtmlEmailMock = vi.fn();

vi.mock("@wse/core/services/shop-ops-alert-email", () => ({
  resolveShopOpsAlertEmail: () => resolveShopOpsAlertEmailMock(),
}));
vi.mock("@wse/core/services/mailer", () => ({
  MailerService: { sendSystemHtmlEmail: sendSystemHtmlEmailMock },
}));

describe("sendOrderPlacementErrorShopAlert", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveShopOpsAlertEmailMock.mockResolvedValue("ops@shop.test");
    sendSystemHtmlEmailMock.mockResolvedValue({ messageId: "x" });
  });

  it("sends ORDER PLACEMENT ERROR with checkout summary", async () => {
    const { sendOrderPlacementErrorShopAlert } = await import("@wse/core/services/order-placement-error-alert");
    await sendOrderPlacementErrorShopAlert({
      error: new Error("save failed"),
      orderData: {
        items: [{ product: "507f1f77bcf86cd799439011", name: "P1", quantity: 1, price: 100 }],
        billingInfo: { name: "B", email: "b@test", zip: "1", city: "c", street: "s" },
        shippingAddress: { name: "S", email: "s@test", zip: "2", city: "c2", street: "s2" },
        total: 100,
      },
      userId: "user-id-1",
      orderId: "order1",
      orderPersisted: false,
      checkoutOptions: { enforceShopEnabled: true, skipStockDecrement: false },
    });

    expect(sendSystemHtmlEmailMock).toHaveBeenCalledTimes(1);
    const arg = sendSystemHtmlEmailMock.mock.calls[0][0];
    expect(arg.to).toBe("ops@shop.test");
    expect(arg.subject).toBe("ORDER PLACEMENT ERROR");
    expect(arg.html).toContain("save failed");
    expect(arg.html).toContain("507f1f77bcf86cd799439011");
    expect(arg.text).toContain("user-id-1");
    expect(arg.text).toContain("b@test");
  });

  it("skips send when no recipient", async () => {
    resolveShopOpsAlertEmailMock.mockResolvedValue("");
    const { sendOrderPlacementErrorShopAlert } = await import("@wse/core/services/order-placement-error-alert");
    await sendOrderPlacementErrorShopAlert({
      error: new Error("x"),
      orderData: {},
      orderPersisted: false,
    });
    expect(sendSystemHtmlEmailMock).not.toHaveBeenCalled();
  });
});

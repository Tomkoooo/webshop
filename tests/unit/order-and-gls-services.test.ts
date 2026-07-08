import { beforeEach, describe, expect, it, vi } from "vitest";

const dbConnectMock = vi.fn();
const productFindByIdMock = vi.fn();
const { decrementCheckoutLineStockMock } = vi.hoisted(() => ({
  decrementCheckoutLineStockMock: vi.fn(),
}));
const cartFindOneAndUpdateMock = vi.fn();
const userFindByIdAndUpdateMock = vi.fn();
const orderFindByIdMock = vi.fn();
const sendEmailMock = vi.fn();
const flagEnabledMock = vi.fn();
const orderSaveMock = vi.fn();
const orderConstructorMock = vi.fn();
const issueInvoiceMock = vi.fn();
const downloadInvoicePdfMock = vi.fn();
const sendInvoiceErrorShopAlertMock = vi.fn();
const sendOrderPlacementErrorShopAlertMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/Product", () => ({ default: { findById: productFindByIdMock } }));
vi.mock("@wse/core/models/Cart", () => ({ default: { findOneAndUpdate: cartFindOneAndUpdateMock } }));
vi.mock("@wse/core/models/User", () => ({ default: { findByIdAndUpdate: userFindByIdAndUpdateMock } }));
vi.mock("@wse/core/models/Order", () => ({
  default: Object.assign(
    function MockOrder(this: Record<string, unknown>, payload: Record<string, unknown>) {
      orderConstructorMock(payload);
      Object.assign(this, payload);
      this._id = "order1";
      this.save = orderSaveMock;
      this.populate = vi.fn().mockResolvedValue(this);
    },
    { findById: orderFindByIdMock }
  ),
}));
vi.mock("@wse/core/services/mailer", () => ({
  MailerService: { sendEmail: sendEmailMock },
}));
vi.mock("@wse/core/services/invoicing-szamlazz", () => ({
  InvoicingSzamlazzService: {
    issueInvoice: (...args: unknown[]) => issueInvoiceMock(...args),
    downloadInvoicePdf: (...args: unknown[]) => downloadInvoicePdfMock(...args),
  },
}));
vi.mock("@wse/core/services/invoice-error-alert", () => ({
  sendInvoiceErrorShopAlert: (...args: unknown[]) => sendInvoiceErrorShopAlertMock(...args),
}));
vi.mock("@wse/core/services/order-placement-error-alert", () => ({
  sendOrderPlacementErrorShopAlert: (...args: unknown[]) => sendOrderPlacementErrorShopAlertMock(...args),
}));
vi.mock("@wse/core/services/feature-flags", () => ({
  FeatureFlagService: { isEnabled: flagEnabledMock },
}));
vi.mock("@wse/core/services/order-guest-access", () => ({
  OrderGuestAccessService: {
    createForOrder: vi.fn().mockResolvedValue("abc123guesttoken"),
    buildViewUrl: vi.fn().mockReturnValue("http://localhost/orders/guest/o1?token=abc"),
  },
}));
vi.mock("@wse/core/lib/app-base-url-server", () => ({
  resolvePublicAppBaseUrl: vi.fn().mockResolvedValue("http://localhost:3000"),
}));
vi.mock("@wse/core/services/new-order-notification", () => ({
  sendNewOrderNotification: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@wse/core/services/inventory-reservation", () => ({
  decrementCheckoutLineStock: (...args: unknown[]) => decrementCheckoutLineStockMock(...args),
  InventoryReservationError: class InventoryReservationError extends Error {
    code: string;
    constructor(message: string, code = "INSUFFICIENT_STOCK") {
      super(message);
      this.name = "InventoryReservationError";
      this.code = code;
    }
  },
}));

describe("OrderService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    flagEnabledMock.mockResolvedValue(true);
    productFindByIdMock.mockResolvedValue({
      _id: "p1",
      name: "Product 1",
      stock: 10,
      isActive: true,
      isVisible: true,
      variants: [],
      save: vi.fn(),
    });
    orderFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        user: { email: "u@test.hu", name: "User" },
      }),
    });
    orderSaveMock.mockResolvedValue(undefined);
    sendEmailMock.mockResolvedValue(undefined);
    decrementCheckoutLineStockMock.mockImplementation(async (_session, line) => ({
      product: String(line?.product ?? "507f1f77bcf86cd799439011"),
      variantId: line?.variantId,
      quantity: Number(line?.quantity ?? 1),
      promoQuantity: 0,
      regularQuantity: Number(line?.quantity ?? 1),
    }));
    issueInvoiceMock.mockResolvedValue({ invoiceId: "INV-TEST-1" });
    downloadInvoicePdfMock.mockResolvedValue(Buffer.from("%PDF-1.0"));
    sendInvoiceErrorShopAlertMock.mockResolvedValue(undefined);
    sendOrderPlacementErrorShopAlertMock.mockResolvedValue(undefined);
    userFindByIdAndUpdateMock.mockResolvedValue({});
  });

  it("creates order and executes side effects", async () => {
    const { OrderService } = await import("@wse/core/services/order");
    const order = await OrderService.createOrderFromCheckoutData(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 1000, name: "P1" }],
        billingInfo: { email: "u@test.hu" },
        shippingAddress: { name: "User", zip: "1111", city: "Bp", street: "Test 1" },
        total: 1000,
      },
      "507f1f77bcf86cd799439012"
    );
    expect(order._id).toBe("order1");
    expect(orderConstructorMock).toHaveBeenCalled();
    expect(decrementCheckoutLineStockMock).toHaveBeenCalled();
    expect(sendEmailMock).toHaveBeenCalled();
    expect(sendOrderPlacementErrorShopAlertMock).not.toHaveBeenCalled();
    expect(userFindByIdAndUpdateMock).not.toHaveBeenCalled();
  });

  it("persists profile addresses when saveAddressToProfile is true", async () => {
    const { OrderService } = await import("@wse/core/services/order");
    const uid = "507f1f77bcf86cd799439012";
    await OrderService.createOrderFromCheckoutData(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 1000, name: "P1" }],
        billingInfo: {
          type: "personal",
          name: "Vásárló",
          email: "u@test.hu",
          phone: "+36",
          zip: "1011",
          city: "Budapest",
          street: "Utca 1",
        },
        shippingAddress: {
          name: "Ship Name",
          email: "u@test.hu",
          phone: "+36",
          zip: "1012",
          city: "Budapest",
          street: "Ship utca 2",
        },
        total: 1000,
        saveAddressToProfile: true,
        billingCountry: "Magyarország",
        shippingCountry: "Magyarország",
      },
      uid
    );
    expect(userFindByIdAndUpdateMock).toHaveBeenCalledWith(
      uid,
      expect.objectContaining({
        $set: expect.objectContaining({
          billingInfo: expect.objectContaining({ name: "Vásárló", country: "Magyarország" }),
          shippingAddress: expect.objectContaining({ name: "Ship Name", country: "Magyarország" }),
        }),
      })
    );
  });

  it("throws when shop is disabled", async () => {
    flagEnabledMock.mockResolvedValue(false);
    const { OrderService } = await import("@wse/core/services/order");
    await expect(
      OrderService.createOrder({ items: [] }, "507f1f77bcf86cd799439012")
    ).rejects.toThrow("Jelenleg a rendelés leadás szünetel");
    expect(sendOrderPlacementErrorShopAlertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderPersisted: false,
        userId: "507f1f77bcf86cd799439012",
      })
    );
  });

  it("throws when product is missing", async () => {
    const { InventoryReservationError } = await import("@wse/core/services/inventory-reservation");
    decrementCheckoutLineStockMock.mockRejectedValueOnce(
      new InventoryReservationError("A termék nem található", "TRANSACTION_FAILED")
    );
    const { OrderService } = await import("@wse/core/services/order");
    await expect(
      OrderService.createOrderFromCheckoutData({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: {},
        shippingAddress: {},
      })
    ).rejects.toThrow("A termék nem található");
    expect(sendOrderPlacementErrorShopAlertMock).toHaveBeenCalled();
  });

  it("handles variant stock deduction path", async () => {
    const { OrderService } = await import("@wse/core/services/order");
    const order = await OrderService.createOrderFromCheckoutData({
      items: [{ product: "507f1f77bcf86cd799439011", variantId: "v1", quantity: 1 }],
      billingInfo: { email: "u@test.hu" },
      shippingAddress: { name: "User", zip: "1111", city: "Bp", street: "Test 1" },
      total: 1000,
    });
    expect(order._id).toBe("order1");
    expect(decrementCheckoutLineStockMock).toHaveBeenCalledWith(
      undefined,
      expect.objectContaining({ product: "507f1f77bcf86cd799439011", variantId: "v1", quantity: 1 })
    );
  });

  it("alerts shop when invoicing fails", async () => {
    issueInvoiceMock.mockRejectedValueOnce(new Error("Számlázz API timeout"));
    const { OrderService } = await import("@wse/core/services/order");
    await OrderService.createOrderFromCheckoutData(
      {
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1, price: 1000, name: "P1" }],
        billingInfo: {
          type: "personal",
          name: "Vásárló",
          email: "u@test.hu",
          phone: "+36",
          zip: "1011",
          city: "Budapest",
          street: "Utca 1",
        },
        shippingAddress: { name: "User", zip: "1111", city: "Bp", street: "Test 1", email: "u@test.hu", phone: "+36" },
        total: 1000,
      },
      "507f1f77bcf86cd799439012"
    );
    expect(sendInvoiceErrorShopAlertMock).toHaveBeenCalledWith(
      "order1",
      expect.objectContaining({ message: "Számlázz API timeout" })
    );
    expect(sendOrderPlacementErrorShopAlertMock).not.toHaveBeenCalled();
  });

  it("throws for insufficient stock", async () => {
    const { InventoryReservationError } = await import("@wse/core/services/inventory-reservation");
    decrementCheckoutLineStockMock.mockRejectedValueOnce(
      new InventoryReservationError("Nincs elég készlet", "INSUFFICIENT_STOCK")
    );
    const { OrderService } = await import("@wse/core/services/order");
    await expect(
      OrderService.createOrderFromCheckoutData({
        items: [{ product: "507f1f77bcf86cd799439011", quantity: 1 }],
        billingInfo: { email: "u@test.hu" },
        shippingAddress: { name: "User", zip: "1111", city: "Bp", street: "Test 1" },
        total: 1000,
      })
    ).rejects.toThrow("Nincs elég készlet");
    expect(sendOrderPlacementErrorShopAlertMock).toHaveBeenCalled();
  });
});

describe("GlsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GLS_API_USERNAME = "user";
    process.env.GLS_API_PASSWORD = "pass";
    process.env.GLS_CLIENT_NUMBER = "123";
    process.env.GLS_PICKUP_NAME = "Pickup";
    process.env.GLS_PICKUP_STREET = "Street";
    process.env.GLS_PICKUP_HOUSE_NUMBER = "12";
    process.env.GLS_PICKUP_CITY = "Budapest";
    process.env.GLS_PICKUP_ZIP = "1111";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        Labels: [80, 68, 70],
        PrintLabelsInfoList: [{ ParcelId: 1, ParcelNumber: 999 }],
      }),
    }));
  });

  it("builds label with parsed response", async () => {
    const { GlsService } = await import("@wse/core/services/gls");
    const result = await GlsService.createLabelForOrder({
      _id: { toString: () => "order1" },
      shippingAddress: {
        name: "Teszt Elek",
        street: "Fo utca 12",
        city: "Budapest",
        zip: "1111",
        phone: "+3611111111",
        email: "test@example.com",
      },
      glsParcelPoint: { id: "123-POINT", name: "Point" },
    } as never);

    expect(result.labelDataBase64).toBe("UERG");
    expect(result.parcelNumber).toBe("999");
  });

  it("throws when gls point is missing", async () => {
    const { GlsService } = await import("@wse/core/services/gls");
    await expect(
      GlsService.createLabelForOrder({
        shippingAddress: { street: "x", name: "n", city: "c", zip: "1", phone: "2", email: "e" },
      } as never)
    ).rejects.toThrow("A rendeléshez nincs GLS csomagpont mentve.");
  });

  it("throws on non-ok gls api response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );
    const { GlsService } = await import("@wse/core/services/gls");
    await expect(
      GlsService.createLabelForOrder({
        _id: { toString: () => "order1" },
        shippingAddress: {
          name: "Teszt Elek",
          street: "Fo utca 12",
          city: "Budapest",
          zip: "1111",
          phone: "+3611111111",
          email: "test@example.com",
        },
        glsParcelPoint: { id: "123-POINT", name: "Point" },
      } as never)
    ).rejects.toThrow("GLS API hiba");
  });

  it("throws on gls api business error list", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          Labels: "AAA",
          PrintLabelsErrorList: [{ ErrorDescription: "validation fail" }],
        }),
      })
    );
    const { GlsService } = await import("@wse/core/services/gls");
    await expect(
      GlsService.createLabelForOrder({
        _id: { toString: () => "order1" },
        shippingAddress: {
          name: "Teszt Elek",
          street: "Fo utca 12",
          city: "Budapest",
          zip: "1111",
          phone: "+3611111111",
          email: "test@example.com",
        },
        glsParcelPoint: { id: "123-POINT", name: "Point" },
      } as never)
    ).rejects.toThrow("validation fail");
  });
});

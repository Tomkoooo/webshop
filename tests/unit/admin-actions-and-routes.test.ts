import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const requireAdminMock = vi.fn();
const authMock = vi.fn();
const revalidatePathMock = vi.fn();
const dbConnectMock = vi.fn();
const featureFindOneAndUpdateMock = vi.fn();
const featureFindOneMock = vi.fn();
const featureFindMock = vi.fn();
const orderFindByIdMock = vi.fn();
const orderFindMock = vi.fn();
const orderUpdateOneMock = vi.fn();
const glsCreateLabelMock = vi.fn();
const foxpostCreateParcelMock = vi.fn();
const foxpostCreateShipmentMock = vi.fn();
const mailerSendMock = vi.fn();

const shippingCreateMock = vi.fn();
const shippingUpdateMock = vi.fn();
const shippingDeleteMock = vi.fn();
const paymentCreateMock = vi.fn();
const paymentUpdateMock = vi.fn();
const paymentDeleteMock = vi.fn();
const couponCreateMock = vi.fn();
const couponDeleteMock = vi.fn();
const couponFindOneMock = vi.fn();
const couponFindByIdAndUpdateMock = vi.fn();

const revalidateTagMock = vi.fn();
vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}));
vi.mock("@wse/core/lib/admin-auth", () => ({ requireAdmin: requireAdminMock }));
vi.mock("@wse/core/auth", () => ({ auth: authMock }));
vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/models/FeatureFlag", () => ({
  default: {
    findOneAndUpdate: featureFindOneAndUpdateMock,
    findOne: featureFindOneMock,
    find: featureFindMock,
  },
}));
vi.mock("@wse/core/services/gls", () => ({
  GlsService: { createLabelForOrder: glsCreateLabelMock },
}));
vi.mock("@wse/core/services/foxpost", () => ({
  FoxpostService: {
    createParcelForOrder: foxpostCreateParcelMock,
    createShipmentForOrder: foxpostCreateShipmentMock,
  },
  FoxpostApiClient: {
    createParcelForOrder: foxpostCreateParcelMock,
    createShipmentForOrder: foxpostCreateShipmentMock,
  },
}));
vi.mock("@wse/core/services/mailer", () => ({ MailerService: { sendEmail: mailerSendMock } }));
vi.mock("@wse/core/models/Order", () => ({
  default: { findById: orderFindByIdMock, find: orderFindMock, updateOne: orderUpdateOneMock },
}));
vi.mock("@wse/core/models/ShippingMethod", () => ({
  default: {
    create: shippingCreateMock,
    findByIdAndUpdate: shippingUpdateMock,
    findByIdAndDelete: shippingDeleteMock,
  },
}));
vi.mock("@wse/core/models/PaymentMethod", () => ({
  default: {
    create: paymentCreateMock,
    findByIdAndUpdate: paymentUpdateMock,
    findByIdAndDelete: paymentDeleteMock,
  },
}));
vi.mock("@wse/core/models/Coupon", () => ({
  default: {
    create: couponCreateMock,
    findByIdAndDelete: couponDeleteMock,
    findOne: couponFindOneMock,
    findByIdAndUpdate: couponFindByIdAndUpdateMock,
  },
  DiscountType: {
    PERCENTAGE: "percentage",
    FIXED_AMOUNT: "fixed_amount",
    FREE_SHIPPING: "free_shipping",
    PRODUCT_PRICE: "product_price",
  },
}));
const glsManagerEnabledMock = vi.fn();
const foxpostManagerEnabledMock = vi.fn();
vi.mock("@wse/core/lib/parcel-feature-flags", () => ({
  isGlsParcelManagerEnabled: glsManagerEnabledMock,
  isFoxpostParcelManagerEnabled: foxpostManagerEnabledMock,
}));

describe("admin actions and routes", () => {
  beforeEach(() => {
    orderFindByIdMock.mockReset();
    orderUpdateOneMock.mockReset();
    vi.clearAllMocks();
    glsManagerEnabledMock.mockResolvedValue(true);
    foxpostManagerEnabledMock.mockResolvedValue(true);
    requireAdminMock.mockResolvedValue({});
    orderUpdateOneMock.mockResolvedValue({});
    authMock.mockResolvedValue({ user: { role: "ADMIN", id: "507f1f77bcf86cd799439011" } });
    featureFindOneMock.mockReturnValue({ lean: vi.fn().mockResolvedValue(null) });
    featureFindMock.mockReturnValue({ sort: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) });
    orderFindMock.mockReturnValue({ sort: vi.fn().mockResolvedValue([]) });
    orderFindByIdMock.mockResolvedValue({
      _id: { toString: () => "ord1" },
      status: "pending",
      billingInfo: { email: "u@test.hu" },
      shippingAddress: { name: "Name" },
      glsParcelPoint: { id: "123", name: "point" },
      save: vi.fn(),
      set: vi.fn(),
      populate: vi.fn().mockResolvedValue({
        _id: { toString: () => "ord1" },
        status: "pending",
        billingInfo: { email: "u@test.hu" },
        shippingAddress: { name: "Name" },
        user: { email: "u@test.hu", name: "Name" },
        save: vi.fn(),
      }),
    });
    glsCreateLabelMock.mockResolvedValue({ labelDataBase64: "UERG", parcelNumber: "123" });
    foxpostCreateParcelMock.mockResolvedValue({ clFoxId: "CLFOX1", refCode: "ref" });
    foxpostCreateShipmentMock.mockResolvedValue({
      clFoxId: "CLFOX1",
      labelDataBase64: "UERG",
      labelPageSize: "A6",
    });
  });

  it("seeds and returns feature flags", async () => {
    const { getAdminFeatureFlags } = await import("@wse/core/actions/admin-flags");
    const flags = await getAdminFeatureFlags();
    expect(Array.isArray(flags)).toBe(true);
    expect(featureFindOneAndUpdateMock).toHaveBeenCalled();
  });

  it("updates one feature flag and revalidates", async () => {
    const { updateFeatureFlag } = await import("@wse/core/actions/admin-flags");
    await updateFeatureFlag("shopPage", false);
    expect(featureFindOneAndUpdateMock).toHaveBeenCalledWith({ key: "shopPage" }, { enabled: false }, { returnDocument: "after" });
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/info");
  });

  it("runs checkout admin CRUD actions", async () => {
    const {
      createShippingMethod,
      updateShippingMethod,
      deleteShippingMethod,
      createPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      createCoupon,
      updateCoupon,
      deleteCoupon,
    } = await import("@wse/core/actions/admin-checkout");
    const fd = new FormData();
    fd.set("name", "X");
    fd.set("grossPrice", "1000");
    fd.set("isActive", "true");

    await createShippingMethod(fd);
    await updateShippingMethod("id1", fd);
    await deleteShippingMethod("id1");
    await createPaymentMethod(fd);
    await updatePaymentMethod("id1", fd);
    await deletePaymentMethod("id1");
    couponFindOneMock.mockResolvedValue(null);
    couponFindByIdAndUpdateMock.mockResolvedValue({ _id: "cid1" });
    await createCoupon({
      code: "A",
      type: "percentage",
      value: 10,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
    });
    await updateCoupon("cid1", {
      code: "A",
      type: "percentage",
      value: 15,
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-12-31"),
      maxUsesPerUser: 2,
    });
    await deleteCoupon("cid1");

    expect(shippingCreateMock).toHaveBeenCalled();
    expect(shippingUpdateMock).toHaveBeenCalled();
    expect(shippingDeleteMock).toHaveBeenCalled();
    expect(paymentCreateMock).toHaveBeenCalled();
    expect(paymentUpdateMock).toHaveBeenCalled();
    expect(paymentDeleteMock).toHaveBeenCalled();
    expect(couponCreateMock).toHaveBeenCalled();
    expect(couponFindByIdAndUpdateMock).toHaveBeenCalled();
    expect(couponDeleteMock).toHaveBeenCalled();
  });

  it("covers admin order action reads and status update", async () => {
    orderFindMock.mockReturnValue({ sort: vi.fn().mockResolvedValue([{ _id: "o1" }]) });
    orderFindByIdMock.mockReturnValue({
      populate: vi.fn().mockResolvedValue({
        _id: { toString: () => "ord1" },
        status: "pending",
        billingInfo: { email: "u@test.hu" },
        shippingAddress: { name: "Name" },
        user: { email: "u@test.hu", name: "Name" },
        save: vi.fn(),
      }),
    });

    const { getOrders, getOrderById, updateOrderStatus } = await import("@wse/core/actions/admin-orders");
    const orders = await getOrders();
    const order = await getOrderById("ord1");
    const updateResult = await updateOrderStatus("ord1", "processing");

    expect(Array.isArray(orders)).toBe(true);
    expect(order).toBeTruthy();
    expect(updateResult.success).toBe(true);
  });

  it("updates order contact info", async () => {
    const order = {
      _id: { toString: () => "ord1" },
      status: "pending",
      billingInfo: { name: "Old Billing", email: "old@test.hu", phone: "111" },
      shippingAddress: { name: "Old Ship", email: "ship@test.hu", phone: "222" },
      save: vi.fn(),
    };
    orderFindByIdMock.mockResolvedValue(order);

    const formData = new FormData();
    formData.set("billingName", "New Billing");
    formData.set("billingEmail", "new@test.hu");
    formData.set("billingPhone", "333");
    formData.set("shippingName", "New Ship");
    formData.set("shippingEmail", "ship-new@test.hu");
    formData.set("shippingPhone", "444");

    const { updateOrderContactInfo } = await import("@wse/core/actions/admin-orders");
    const result = await updateOrderContactInfo("ord1", formData);

    expect(result.success).toBe(true);
    expect(order.billingInfo.name).toBe("New Billing");
    expect(order.shippingAddress.phone).toBe("444");
    expect(order.save).toHaveBeenCalled();
  });

  it("generates gls label from admin order action", async () => {
    const { generateOrderGlsLabel } = await import("@wse/core/actions/admin-orders");
    const result = await generateOrderGlsLabel("507f1f77bcf86cd799439011");
    expect(result.success).toBe(true);
    expect(glsCreateLabelMock).toHaveBeenCalled();
  });

  it("returns failure payload when gls label generation throws", async () => {
    glsCreateLabelMock.mockRejectedValueOnce(new Error("gls-fail"));
    const { generateOrderGlsLabel } = await import("@wse/core/actions/admin-orders");
    const result = await generateOrderGlsLabel("507f1f77bcf86cd799439011");
    expect(result.success).toBe(false);
    expect(result.error).toContain("gls-fail");
  });

  it("serves GLS pdf stream for admin", async () => {
    orderFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ glsLabel: { labelDataBase64: "UERG" } }),
    });
    const { GET } = await import("@wse/admin/app/api/admin/orders/[id]/gls-label/route");
    const req = new NextRequest("http://localhost/api/admin/orders/1/gls-label");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("generates foxpost shipment from admin order action", async () => {
    orderFindByIdMock.mockResolvedValueOnce({
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      foxpostParcelPoint: { id: "hu5516", name: "Fox" },
      foxpostShipment: {},
      shippingAddress: { name: "N", email: "a@a.com", phone: "+36201234567" },
      save: vi.fn(),
      set: vi.fn(),
    });
    const { generateOrderFoxpostShipment } = await import("@wse/core/actions/admin-orders");
    const result = await generateOrderFoxpostShipment("507f1f77bcf86cd799439011");
    expect(result.success).toBe(true);
    expect(foxpostCreateShipmentMock).toHaveBeenCalled();
  });

  it("serves Foxpost pdf stream for admin", async () => {
    orderFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ foxpostShipment: { labelDataBase64: "UERG" } }),
    });
    const { GET } = await import("@wse/admin/app/api/admin/orders/[id]/foxpost-label/route");
    const req = new NextRequest("http://localhost/api/admin/orders/1/foxpost-label");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
  });

  it("returns 404 when gls label payload missing", async () => {
    orderFindByIdMock.mockReturnValue({
      lean: vi.fn().mockResolvedValue({ glsLabel: {} }),
    });
    const { GET } = await import("@wse/admin/app/api/admin/orders/[id]/gls-label/route");
    const req = new NextRequest("http://localhost/api/admin/orders/1/gls-label");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 401 from gls-label route when unauthorized", async () => {
    requireAdminMock.mockRejectedValue(new Error("Unauthorized"));
    const { GET } = await import("@wse/admin/app/api/admin/orders/[id]/gls-label/route");
    const req = new NextRequest("http://localhost/api/admin/orders/1/gls-label");
    const res = await GET(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(401);
  });

  it("throws unauthorized from admin actions for non-admin users", async () => {
    authMock.mockResolvedValueOnce({ user: { role: "USER" } });
    const { getOrders } = await import("@wse/core/actions/admin-orders");
    await expect(getOrders()).rejects.toThrow("Unauthorized");
  });

  it("throws when admin order is missing for status update", async () => {
    orderFindByIdMock.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue(null),
    });
    const { updateOrderStatus } = await import("@wse/core/actions/admin-orders");
    await expect(updateOrderStatus("missing", "processing")).rejects.toThrow("Order not found");
  });

  it("throws when gls order is missing or no parcel point", async () => {
    orderFindByIdMock.mockResolvedValueOnce(null);
    const { generateOrderGlsLabel } = await import("@wse/core/actions/admin-orders");
    await expect(generateOrderGlsLabel("missing")).rejects.toThrow("Order not found");

    orderFindByIdMock.mockResolvedValueOnce({
      _id: { toString: () => "ord1" },
      save: vi.fn(),
      glsParcelPoint: null,
    });
    await expect(generateOrderGlsLabel("ord1")).rejects.toThrow("nincs GLS csomagpont");
  });

  it("handles status email send failure branch", async () => {
    mailerSendMock.mockRejectedValueOnce(new Error("smtp fail"));
    orderFindByIdMock.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: { toString: () => "ord1" },
        status: "pending",
        billingInfo: { email: "u@test.hu" },
        shippingAddress: { name: "Name" },
        user: { email: "u@test.hu", name: "Name" },
        save: vi.fn(),
      }),
    });
    const { updateOrderStatus } = await import("@wse/core/actions/admin-orders");
    const result = await updateOrderStatus("ord1", "processing");
    expect(result.success).toBe(true);
  });

  it("covers status label fallback branch with custom status", async () => {
    orderFindByIdMock.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: { toString: () => "ord2" },
        status: "custom_status_old",
        billingInfo: { email: "u@test.hu" },
        shippingAddress: { name: "Name" },
        user: { email: "u@test.hu", name: "Name" },
        save: vi.fn(),
      }),
    });
    const { updateOrderStatus } = await import("@wse/core/actions/admin-orders");
    const result = await updateOrderStatus("ord2", "processing");
    expect(result.success).toBe(true);
    expect(mailerSendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          oldStatus: "custom_status_old",
          newStatus: "Feldolgozás alatt",
        }),
      })
    );
  });

  it("covers update status branch when customer email is missing", async () => {
    orderFindByIdMock.mockReturnValueOnce({
      populate: vi.fn().mockResolvedValue({
        _id: { toString: () => "ord3" },
        status: "pending",
        billingInfo: {},
        shippingAddress: { name: "Name" },
        user: {},
        save: vi.fn(),
      }),
    });
    const { updateOrderStatus } = await import("@wse/core/actions/admin-orders");
    const result = await updateOrderStatus("ord3", "processing");
    expect(result.success).toBe(true);
    expect(mailerSendMock).not.toHaveBeenCalled();
  });

  it("covers generate label path without session user id", async () => {
    authMock.mockResolvedValueOnce({ user: { role: "ADMIN" } }).mockResolvedValueOnce({ user: { role: "ADMIN" } });
    const { generateOrderGlsLabel } = await import("@wse/core/actions/admin-orders");
    const result = await generateOrderGlsLabel("507f1f77bcf86cd799439011");
    expect(result.success).toBe(true);
  });

  it("covers non-Error throw branch in gls generation", async () => {
    glsCreateLabelMock.mockRejectedValueOnce("raw-failure");
    const { generateOrderGlsLabel } = await import("@wse/core/actions/admin-orders");
    const result = await generateOrderGlsLabel("507f1f77bcf86cd799439011");
    expect(result.success).toBe(false);
    expect(result.error).toContain("sikertelen");
  });

  it("bulk generates parcel labels for eligible orders and skips existing", async () => {
    const saveMock = vi.fn();
    orderFindMock.mockResolvedValueOnce([
      {
        _id: { toString: () => "507f1f77bcf86cd799439011" },
        glsParcelPoint: { id: "gls-1" },
        glsLabel: {},
        save: saveMock,
        set: vi.fn(),
      },
      {
        _id: { toString: () => "507f1f77bcf86cd799439012" },
        foxpostParcelPoint: { id: "fp-1" },
        foxpostShipment: { clFoxId: "CLFOX", labelDataBase64: "UERG" },
        save: saveMock,
        set: vi.fn(),
      },
    ]);

    const { bulkGenerateParcelLabels } = await import("@wse/core/actions/admin-orders");
    const result = await bulkGenerateParcelLabels([
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012",
      "invalid",
    ]);

    expect(result.successCount).toBe(1);
    expect(result.skippedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(glsCreateLabelMock).toHaveBeenCalledTimes(1);
    expect(foxpostCreateShipmentMock).not.toHaveBeenCalled();
  });

  it("skips bulk label generation when parcel manager flag is disabled", async () => {
    glsManagerEnabledMock.mockResolvedValueOnce(false);
    orderFindMock.mockResolvedValueOnce([
      {
        _id: { toString: () => "507f1f77bcf86cd799439011" },
        glsParcelPoint: { id: "gls-1" },
        glsLabel: {},
        save: vi.fn(),
        set: vi.fn(),
      },
    ]);

    const { bulkGenerateParcelLabels } = await import("@wse/core/actions/admin-orders");
    const result = await bulkGenerateParcelLabels(["507f1f77bcf86cd799439011"]);

    expect(result.successCount).toBe(0);
    expect(result.skippedCount).toBe(1);
    expect(result.skips[0]?.reason).toBe("manager_disabled");
    expect(glsCreateLabelMock).not.toHaveBeenCalled();
  });
});

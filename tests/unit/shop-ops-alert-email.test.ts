import { beforeEach, describe, expect, it, vi } from "vitest";

const dbConnectMock = vi.fn();
const getAllShopContentMock = vi.fn();

vi.mock("@wse/core/lib/db", () => ({ default: dbConnectMock }));
vi.mock("@wse/core/services/shop-content", () => ({
  ShopContentService: { getAll: getAllShopContentMock },
}));

describe("resolveShopOpsAlertEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbConnectMock.mockResolvedValue(undefined);
    delete process.env.INVOICE_ERROR_ALERT_EMAIL;
  });

  it("returns trimmed contact_email from shop content", async () => {
    getAllShopContentMock.mockResolvedValue({ contact_email: " shop@x.test " });
    const { resolveShopOpsAlertEmail } = await import("@wse/core/services/shop-ops-alert-email");
    await expect(resolveShopOpsAlertEmail()).resolves.toBe("shop@x.test");
  });

  it("falls back to INVOICE_ERROR_ALERT_EMAIL when contact empty", async () => {
    getAllShopContentMock.mockResolvedValue({});
    process.env.INVOICE_ERROR_ALERT_EMAIL = "ops@fallback.test";
    const { resolveShopOpsAlertEmail } = await import("@wse/core/services/shop-ops-alert-email");
    await expect(resolveShopOpsAlertEmail()).resolves.toBe("ops@fallback.test");
  });
});

describe("resolveInvoiceErrorAlertEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbConnectMock.mockResolvedValue(undefined);
    delete process.env.INVOICE_ERROR_ALERT_EMAIL;
  });

  it("uses dedicated CMS list when configured", async () => {
    getAllShopContentMock.mockResolvedValue({
      invoice_error_alert_emails: JSON.stringify(["inv1@test.com", "inv2@test.com"]),
      contact_email: "public@test.com",
    });
    const { resolveInvoiceErrorAlertEmails } = await import("@wse/core/services/shop-ops-alert-email");
    await expect(resolveInvoiceErrorAlertEmails()).resolves.toEqual([
      "inv1@test.com",
      "inv2@test.com",
    ]);
  });

  it("falls back to general shop ops email when dedicated list empty", async () => {
    getAllShopContentMock.mockResolvedValue({ contact_email: "shop@x.test" });
    const { resolveInvoiceErrorAlertEmails } = await import("@wse/core/services/shop-ops-alert-email");
    await expect(resolveInvoiceErrorAlertEmails()).resolves.toEqual(["shop@x.test"]);
  });
});

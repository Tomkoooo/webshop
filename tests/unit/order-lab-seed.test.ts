import { describe, expect, it, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

vi.mock("@wse/core/lib/db", () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

describe("order-lab seed", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("creates sandbox_orders documents without touching orders collection", async () => {
    const sandboxCreates: unknown[] = [];
    const orderCreates: unknown[] = [];

    vi.doMock("@wse/plugin-order-lab/models/SandboxOrder", () => ({
      default: {
        create: vi.fn(async (doc: unknown) => {
          sandboxCreates.push(doc);
          return { _id: new mongoose.Types.ObjectId() };
        }),
        deleteMany: vi.fn(),
        find: vi.fn().mockReturnValue({ sort: vi.fn().mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }) }),
        countDocuments: vi.fn().mockResolvedValue(0),
      },
    }));

    vi.doMock("@wse/core/models/Order", () => ({
      default: {
        create: vi.fn(async (doc: unknown) => {
          orderCreates.push(doc);
        }),
      },
    }));

    vi.doMock("@wse/core/models/Product", () => ({
      default: {
        find: vi.fn().mockReturnValue({
          sort: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              lean: vi.fn().mockResolvedValue([
                {
                  _id: new mongoose.Types.ObjectId(),
                  name: "Teszt könyv",
                  netPrice: 3000,
                  grossPrice: 3810,
                  vatPercent: 27,
                  variants: [
                    {
                      id: "v1",
                      isActive: true,
                      netPrice: 3000,
                      grossPrice: 3810,
                      attributes: { size: "M" },
                      sku: "SKU-1",
                    },
                  ],
                },
              ]),
            }),
          }),
        }),
      },
    }));

    vi.doMock("@wse/core/lib/foxpost-sandbox-apms", () => ({
      resolveSandboxApm: vi.fn().mockResolvedValue({
        id: "hu350",
        name: "Sandbox APM",
        zip: "8200",
        city: "Veszprém",
        address: "Teszt cím",
      }),
    }));

    const { seedSandboxOrders } = await import("@wse/plugin-order-lab/services/seed-sandbox-orders");
    const result = await seedSandboxOrders({ count: 2 });

    expect(result.createdCount).toBe(2);
    expect(sandboxCreates).toHaveLength(2);
    expect(orderCreates).toHaveLength(0);
    expect((sandboxCreates[0] as { orderNumber: string }).orderNumber).toMatch(/^SBOX-/);
    expect((sandboxCreates[0] as { foxpostParcelPoint: { id: string } }).foxpostParcelPoint.id).toBe("hu350");
  });
});

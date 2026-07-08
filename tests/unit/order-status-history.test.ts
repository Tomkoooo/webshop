import { describe, expect, it } from "vitest";
import { recordOrderStatusChange } from "@wse/core/lib/order-status-history";

describe("order status history", () => {
  it("records transitions and updates statusChangedAt", () => {
    const changedAt = new Date("2026-06-24T10:00:00.000Z");
    const order: {
      status: string;
      statusChangedAt?: Date;
      statusHistory?: Array<{ from: string; to: string; changedAt: Date }>;
    } = { status: "processing" };

    const changed = recordOrderStatusChange(order, "processing", "shipped", changedAt);
    expect(changed).toBe(true);
    expect(order.status).toBe("shipped");
    expect(order.statusChangedAt).toEqual(changedAt);
    expect(order.statusHistory).toEqual([
      { from: "processing", to: "shipped", changedAt },
    ]);
  });

  it("skips no-op status updates", () => {
    const order = { status: "shipped", statusHistory: [] as Array<{ from: string; to: string; changedAt: Date }> };
    const changed = recordOrderStatusChange(order, "shipped", "shipped");
    expect(changed).toBe(false);
    expect(order.statusHistory).toEqual([]);
  });
});

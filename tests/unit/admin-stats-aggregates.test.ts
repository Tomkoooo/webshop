import { describe, expect, it } from "vitest";
import { buildMonthlyRevenueSeries } from "@wse/core/lib/admin-stats-aggregates";
import { summarizeAdminCustomersFromOrderEmails } from "@wse/core/lib/admin-customers";

describe("buildMonthlyRevenueSeries", () => {
  it("fills missing months with zero revenue", () => {
    const now = new Date("2026-06-15T12:00:00.000Z");
    const series = buildMonthlyRevenueSeries(
      [{ _id: { year: 2026, month: 6 }, revenue: 12000, orders: 3 }],
      now
    );

    expect(series).toHaveLength(6);
    expect(series[series.length - 1]).toEqual({
      label: "2026.06",
      revenue: 12000,
      orders: 3,
    });
    expect(series[0].revenue).toBe(0);
  });
});

describe("summarizeAdminCustomersFromOrderEmails", () => {
  it("counts guest vs registered order customers", () => {
    const summary = summarizeAdminCustomersFromOrderEmails(
      ["guest@example.com", "member@example.com", "member@example.com"],
      [
        { _id: "u1", email: "member@example.com", role: "USER" },
        { _id: "u2", email: "admin@example.com", role: "ADMIN" },
      ]
    );

    expect(summary.totalCustomersCount).toBe(2);
    expect(summary.registeredCustomersCount).toBe(1);
    expect(summary.registeredOrderCustomersCount).toBe(1);
    expect(summary.guestCustomersCount).toBe(1);
  });
});

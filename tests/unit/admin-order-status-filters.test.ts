import { describe, expect, it } from "vitest";
import { buildStatusTransitionQuery } from "@wse/core/lib/admin-order-status-filters";
import { buildAdminOrdersMongoQuery } from "@wse/core/lib/admin-orders-query";
import { shopDayEndUtc, shopDayStartUtc } from "@wse/core/lib/shop-timezone";

describe("shop timezone date filters", () => {
  it("builds Budapest midnight bounds for a summer day", () => {
    const start = shopDayStartUtc("2026-06-24");
    const end = shopDayEndUtc("2026-06-24");
    expect(start).not.toBeNull();
    expect(end).not.toBeNull();

    const startParts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Budapest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(start!);
    const hour = startParts.find((part) => part.type === "hour")?.value;
    const day = startParts.find((part) => part.type === "day")?.value;
    expect(day).toBe("24");
    expect(hour).toBe("00");
  });
});

describe("status transition filters", () => {
  it("matches orders that became shipped on a given day", () => {
    const clause = buildStatusTransitionQuery({
      status: "shipped",
      statusChangedOn: "2026-06-24",
    });
    expect(clause).toBeTruthy();
    expect(clause?.$or).toHaveLength(2);

    const historyMatch = (clause?.$or as Array<Record<string, unknown>>)[0]
      .statusHistory as { $elemMatch: { to: string; changedAt: { $gte: Date; $lte: Date } } };
    expect(historyMatch.$elemMatch.to).toBe("shipped");
    expect(historyMatch.$elemMatch.changedAt.$gte).toBeInstanceOf(Date);
    expect(historyMatch.$elemMatch.changedAt.$lte).toBeInstanceOf(Date);
  });

  it("combines current status with transition day in mongo query", () => {
    const query = buildAdminOrdersMongoQuery({
      status: "shipped",
      statusChangedOn: "2026-06-24",
    });
    expect(query.status).toBe("shipped");
    expect(Array.isArray(query.$and)).toBe(true);
    const andClause = (query.$and as Array<Record<string, unknown>>)[0];
    expect(andClause.$or).toBeTruthy();
  });

  it("supports status transition date ranges", () => {
    const clause = buildStatusTransitionQuery({
      status: "shipped",
      statusChangedFrom: "2026-06-22",
      statusChangedTo: "2026-06-24",
    });
    const historyMatch = (clause?.$or as Array<Record<string, unknown>>)[0]
      .statusHistory as { $elemMatch: { changedAt: { $gte: Date; $lte: Date } } };
    expect(historyMatch.$elemMatch.changedAt.$gte).toBeInstanceOf(Date);
    expect(historyMatch.$elemMatch.changedAt.$lte).toBeInstanceOf(Date);
  });
});

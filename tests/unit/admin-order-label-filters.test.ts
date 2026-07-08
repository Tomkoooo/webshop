import { describe, expect, it } from "vitest";
import {
  buildFoxpostLabelGeneratedQuery,
  buildGlsLabelGeneratedQuery,
} from "@wse/core/lib/admin-order-label-filters";
import { buildAdminOrdersMongoQuery } from "@wse/core/lib/admin-orders-query";

describe("parcel label date filters", () => {
  it("filters Foxpost labels generated on a calendar day", () => {
    const clause = buildFoxpostLabelGeneratedQuery({ foxpostLabelOn: "2026-06-24" });
    expect(clause).toBeTruthy();
    const range = clause!["foxpostShipment.generatedAt"] as { $gte: Date; $lte: Date };
    expect(range.$gte).toBeInstanceOf(Date);
    expect(range.$lte).toBeInstanceOf(Date);
  });

  it("combines Foxpost label day with shipping type in mongo query", () => {
    const query = buildAdminOrdersMongoQuery({
      shippingType: "foxpost",
      foxpostLabelOn: "2026-06-24",
    });
    expect(Array.isArray(query.$and)).toBe(true);
    const andClauses = query.$and as Array<Record<string, unknown>>;
    expect(
      andClauses.some((clause) => "foxpostShipment.generatedAt" in clause)
    ).toBe(true);
  });

  it("filters GLS labels by date range", () => {
    const clause = buildGlsLabelGeneratedQuery({
      glsLabelFrom: "2026-06-01",
      glsLabelTo: "2026-06-03",
    });
    expect(clause).toBeTruthy();
    expect(clause!["glsLabel.generatedAt"]).toBeTruthy();
  });
});

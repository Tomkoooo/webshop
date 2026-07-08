import { describe, expect, it } from "vitest";
import { buildAdminOrdersExportRows } from "@wse/core/lib/admin-orders-export";

describe("admin orders export numbered column", () => {
  it("includes Tétel N sorszám from selectedAttributes", () => {
    const rows = buildAdminOrdersExportRows([
      {
        _id: "order1",
        items: [
          {
            name: "Képregény",
            variantId: "num-42",
            variantLabel: "Szám: 42",
            selectedAttributes: { Szám: "42" },
            quantity: 1,
            price: 5000,
          },
        ],
      },
    ]);
    expect(rows[0]["Tétel 1 sorszám"]).toBe("42");
    expect(rows[0]["Tétel 1 variáns"]).toBe("Szám: 42");
  });
});

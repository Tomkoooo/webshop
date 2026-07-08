import { describe, expect, it } from "vitest";
import { resolveProductView } from "@wse/core/lib/product-variants";

describe("resolveProductView", () => {
  it("handles listing products without descriptions", () => {
    const view = resolveProductView({
      name: "Listing-only product",
      images: [],
      netPrice: 1000,
      grossPrice: 1270,
      stock: 4,
    });

    expect(view.description).toBe("");
    expect(view.seo.description).toBe("");
  });
});

import { describe, expect, it } from "vitest";
import {
  shouldUseCompactVariantPickerOnCard,
  initialCardVariantId,
  CARD_VARIANT_PICKER_MAX_CHIPS,
} from "@wse/core/lib/product-card-variants";

describe("product-card-variants", () => {
  it("uses compact picker for unique numbered products", () => {
    const product = {
      name: "Comic",
      netPrice: 1000,
      uniqueNumberedVariants: { enabled: true, attributeName: "Szám", maxQuantityPerLine: 1 },
      variantOptions: [{ name: "Szám", values: Array.from({ length: 100 }, (_, i) => String(i)) }],
      variants: Array.from({ length: 100 }, (_, i) => ({
        id: `num-${i}`,
        attributes: { Szám: String(i) },
        netPrice: 1000,
        stock: 1,
        isActive: true,
      })),
    };
    expect(shouldUseCompactVariantPickerOnCard(product)).toBe(true);
    expect(initialCardVariantId(product)).toBe("");
  });

  it("uses compact picker when option values exceed cap", () => {
    const product = {
      name: "X",
      netPrice: 100,
      variantOptions: [
        {
          name: "Szám",
          values: Array.from({ length: CARD_VARIANT_PICKER_MAX_CHIPS + 1 }, (_, i) => String(i)),
        },
      ],
      variants: Array.from({ length: CARD_VARIANT_PICKER_MAX_CHIPS + 1 }, (_, i) => ({
        id: `v${i}`,
        attributes: { Szám: String(i) },
        netPrice: 100,
        stock: 1,
        isActive: true,
      })),
    };
    expect(shouldUseCompactVariantPickerOnCard(product)).toBe(true);
  });

  it("allows card add-to-cart with base variant when numbered stock is gone", () => {
    const product = {
      name: "Comic",
      netPrice: 1000,
      uniqueNumberedVariants: { enabled: true, attributeName: "Szám", maxQuantityPerLine: 1 },
      variants: [
        { id: "num-1", attributes: { Szám: "1" }, netPrice: 1000, stock: 0, isActive: true },
        { id: "base", attributes: {}, netPrice: 1000, stock: 3, isActive: true },
      ],
    };
    expect(shouldUseCompactVariantPickerOnCard(product)).toBe(false);
    expect(initialCardVariantId(product)).toBe("base");
  });

  it("shows chip picker for small variant sets", () => {
    const product = {
      name: "X",
      netPrice: 100,
      variantOptions: [{ name: "Size", values: ["S", "M"] }],
      variants: [
        { id: "s", attributes: { Size: "S" }, netPrice: 100, stock: 1, isActive: true },
        { id: "m", attributes: { Size: "M" }, netPrice: 100, stock: 1, isActive: true },
      ],
    };
    expect(shouldUseCompactVariantPickerOnCard(product)).toBe(false);
    expect(initialCardVariantId(product)).toBe("s");
  });
});

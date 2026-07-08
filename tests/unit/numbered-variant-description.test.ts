import { describe, expect, it } from "vitest";
import {
  applyNumberedDescriptionTemplate,
  isBaseVariantId,
  resolveVariantDescription,
} from "@wse/core/lib/unique-numbered-variants";

describe("numbered variant description", () => {
  it("applyNumberedDescriptionTemplate replaces tokens", () => {
    expect(
      applyNumberedDescriptionTemplate("Példány: {{number}}", { Szám: "42" }, "Szám")
    ).toBe("Példány: 42");
    expect(applyNumberedDescriptionTemplate("Nr. {{szam}}", { Szám: "7" })).toBe("Nr. 7");
  });

  it("resolveVariantDescription prefers per-variant override", () => {
    const product = {
      description: "Alap",
      uniqueNumberedVariants: {
        enabled: true,
        attributeName: "Szám",
        maxQuantityPerLine: 1,
        descriptionHtml: "Sorszám: {{number}}",
      },
    };
    expect(
      resolveVariantDescription(product, {
        descriptionOverride: "Egyedi",
        attributes: { Szám: "10" },
      })
    ).toBe("Egyedi");
  });

  it("resolveVariantDescription uses numbered template when no per-variant override", () => {
    const product = {
      description: "Alap",
      uniqueNumberedVariants: {
        enabled: true,
        attributeName: "Szám",
        maxQuantityPerLine: 1,
        descriptionHtml: "Limitált #{{number}}",
      },
    };
    expect(
      resolveVariantDescription(product, {
        attributes: { Szám: "36" },
      })
    ).toBe("Limitált #36");
  });

  it("resolveVariantDescription falls back to product description", () => {
    expect(
      resolveVariantDescription(
        { description: "Alap", uniqueNumberedVariants: { enabled: true, attributeName: "Szám", maxQuantityPerLine: 1 } },
        { attributes: { Szám: "1" } }
      )
    ).toBe("Alap");
  });

  it("resolveVariantDescription without variant returns product description", () => {
    expect(resolveVariantDescription({ description: "Alap" }, null)).toBe("Alap");
  });

  it("resolveVariantDescription uses product description for base variant, not numbered template", () => {
    const product = {
      description: "Általános példány leírása",
      uniqueNumberedVariants: {
        enabled: true,
        attributeName: "Szám",
        maxQuantityPerLine: 1,
        descriptionHtml: "Sorszám: {{number}}",
        baseVariantId: "base",
      },
    };
    expect(
      resolveVariantDescription(product, {
        id: "base",
        attributes: {},
      })
    ).toBe("Általános példány leírása");
  });

  it("isBaseVariantId only matches configured base when numbered mode is enabled", () => {
    const config = {
      enabled: true,
      attributeName: "Szám",
      maxQuantityPerLine: 1,
      baseVariantId: "base",
    };
    expect(isBaseVariantId("base", config)).toBe(true);
    expect(isBaseVariantId("num-36", config)).toBe(false);
    expect(isBaseVariantId("36", config)).toBe(false);
  });

  it("resolveVariantDescription applies numbered template for num-* id (not product description)", () => {
    const product = {
      description: "Általános termék leírás",
      uniqueNumberedVariants: {
        enabled: true,
        attributeName: "Szám",
        maxQuantityPerLine: 1,
        descriptionHtml: "Sorszám: {{number}}",
        baseVariantId: "base",
      },
    };
    expect(
      resolveVariantDescription(
        product,
        { id: "num-36", attributes: { Szám: "36" } },
        "num-36"
      )
    ).toBe("Sorszám: 36");
  });

  it("resolveVariantDescription derives issue number from num-* id when attributes are empty", () => {
    expect(
      resolveVariantDescription(
        {
          description: "Alap",
          uniqueNumberedVariants: {
            enabled: true,
            attributeName: "Szám",
            maxQuantityPerLine: 1,
            descriptionHtml: "#{{number}}",
          },
        },
        { id: "num-42", attributes: {} },
        "num-42"
      )
    ).toBe("#42");
  });

  it("resolveVariantDescription prefers base variant descriptionOverride over product description", () => {
    expect(
      resolveVariantDescription(
        {
          description: "Termék leírás",
          uniqueNumberedVariants: {
            enabled: true,
            attributeName: "Szám",
            maxQuantityPerLine: 1,
            descriptionHtml: "Nr. {{number}}",
          },
        },
        { id: "base", descriptionOverride: "Alap variáns szöveg" }
      )
    ).toBe("Alap variáns szöveg");
  });
});

import { describe, expect, it } from "vitest";
import {
  ELADHATO_NUMBER_RANGES,
  countEladhatoPreset,
  expandNumberRanges,
  variantIdForNumber,
  buildNumberedVariantRecords,
  removeNumberedVariants,
  rebuildNumberedVariantOptions,
  setNumberedVariantsActive,
  formatNumberRangeLabel,
  numberRangesToChips,
  resolveNumberRangeChips,
  inferNumberRangesFromIssueNumbers,
} from "@wse/core/lib/numbered-variant-ranges";

describe("numbered-variant-ranges", () => {
  it("expands inclusive ranges and global excludes", () => {
    expect(expandNumberRanges([{ from: 1, to: 3 }], [2])).toEqual([1, 3]);
  });

  it("expands per-range excludes", () => {
    expect(expandNumberRanges([{ from: 10, to: 12, exclude: [11] }])).toEqual([10, 12]);
  });

  it("ELADHATÓ preset totals 369 numbers", () => {
    const numbers = expandNumberRanges(ELADHATO_NUMBER_RANGES);
    expect(numbers).toHaveLength(369);
    expect(countEladhatoPreset()).toBe(369);
    expect(numbers[0]).toBe(36);
    expect(numbers[10]).toBe(46);
    expect(numbers[11]).toBe(49);
    expect(numbers).not.toContain(50);
    expect(numbers[37]).toBe(76);
    expect(numbers[38]).toBe(79);
    expect(numbers[numbers.length - 1]).toBe(409);
  });

  it("variantIdForNumber is stable", () => {
    expect(variantIdForNumber(42)).toBe("num-42");
  });

  it("buildNumberedVariantRecords preserves existing stock when merging", () => {
    const existing = new Map([["num-42", { stock: 0, isActive: true }]]);
    const records = buildNumberedVariantRecords([42], {
      netPrice: 1000,
      existingById: existing,
    });
    expect(records[0].stock).toBe(0);
    expect(records[0].attributes.Szám).toBe("42");
  });

  it("removeNumberedVariants deletes all or by range", () => {
    const variants = [
      { id: "num-36", attributes: { Szám: "36" } },
      { id: "num-37", attributes: { Szám: "37" } },
      { id: "size-m", attributes: { Size: "M" } },
    ];
    expect(removeNumberedVariants(variants, { all: true })).toEqual([
      { id: "size-m", attributes: { Size: "M" } },
    ]);
    expect(removeNumberedVariants(variants, { ranges: [{ from: 36, to: 36 }] })).toEqual([
      { id: "num-37", attributes: { Szám: "37" } },
      { id: "size-m", attributes: { Size: "M" } },
    ]);
    expect(rebuildNumberedVariantOptions([{ id: "num-40", attributes: { Szám: "40" } }], "Szám")).toEqual([
      { name: "Szám", values: ["40"] },
    ]);
  });

  it("setNumberedVariantsActive toggles all or by range without touching other variants", () => {
    const variants = [
      { id: "num-36", isActive: true },
      { id: "num-37", isActive: true },
      { id: "size-m", isActive: true },
    ];
    const allOff = setNumberedVariantsActive(variants, false, { all: true });
    expect(allOff.find((v) => v.id === "num-36")?.isActive).toBe(false);
    expect(allOff.find((v) => v.id === "size-m")?.isActive).toBe(true);

    const rangeOn = setNumberedVariantsActive(allOff, true, { ranges: [{ from: 36, to: 36 }] });
    expect(rangeOn.find((v) => v.id === "num-36")?.isActive).toBe(true);
    expect(rangeOn.find((v) => v.id === "num-37")?.isActive).toBe(false);
  });

  it("rejects oversized expansion", () => {
    expect(() =>
      expandNumberRanges([{ from: 1, to: 3000 }])
    ).toThrow(/Túl sok sorszám/);
  });

  it("formats range labels and resolves chips from stored JSON", () => {
    expect(formatNumberRangeLabel({ from: 40, to: 40 })).toBe("40");
    expect(formatNumberRangeLabel({ from: 36, to: 46 })).toBe("36–46");
    expect(numberRangesToChips(ELADHATO_NUMBER_RANGES).map((c) => c.label)).toEqual([
      "36–46",
      "49–76",
      "79–409",
    ]);
    const chips = resolveNumberRangeChips(
      [{ from: 10, to: 12 }],
      [
        { id: "num-10", attributes: { Szám: "10" } },
        { id: "num-99", attributes: { Szám: "99" } },
      ],
      "Szám"
    );
    expect(chips).toEqual([{ label: "10–12", from: 10, to: 12 }]);
  });

  it("infers range chips from variant issue numbers when JSON is missing", () => {
    expect(inferNumberRangesFromIssueNumbers([36, 37, 40, 42])).toEqual([
      { from: 36, to: 37 },
      { from: 40, to: 40 },
      { from: 42, to: 42 },
    ]);
    const chips = resolveNumberRangeChips(
      undefined,
      [
        { id: "num-36", attributes: { Szám: "36" } },
        { id: "num-37", attributes: { Szám: "37" } },
        { id: "num-40", attributes: { Szám: "40" } },
      ],
      "Szám"
    );
    expect(chips.map((c) => c.label)).toEqual(["36–37", "40"]);
  });
});

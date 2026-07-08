import { describe, expect, it } from "vitest";
import { formatOrderNumber, formatOrderNumberLabel } from "@wse/core/lib/order-number";
import {
  customerGrossFromNetWithDiscount,
  customerUnitGross,
  deriveNetFromGross,
  feeLineBreakdownFromGross,
  grossFromNetWithDiscount,
  grossToNet,
  highestCartVatPercent,
  impliedVatPercentFromNetGross,
  listingHasPriceRange,
  listingPriceSummary,
  netToGross,
  priceBreakdownFromGross,
  totalsBreakdownForOrderSnapshot,
  totalsBreakdownFromGross,
} from "@wse/core/lib/pricing";

describe("order number helpers", () => {
  it("formats display order numbers from Mongo ids", () => {
    expect(formatOrderNumber("69fda698f300b22d8450b638")).toBe("50B638");
    expect(formatOrderNumberLabel("69fda698f300b22d8450b638")).toBe("#50B638");
  });
});

describe("pricing helpers", () => {
  it("converts between net and gross HUF values with 27% VAT", () => {
    expect(netToGross(1200)).toBe(1524);
    expect(grossToNet(1524)).toBe(1200);
  });

  it("matches checkout gross-after-discount calculation", () => {
    expect(grossFromNetWithDiscount(1200, 10)).toBe(1372);
  });

  it("keeps merchant-entered gross at 5% VAT (2026) via stored gross", () => {
    expect(netToGross(1930, 5)).toBe(2027);
    expect(customerUnitGross(1930, 5, 2026)).toBe(2026);
    expect(deriveNetFromGross(2026, 5)).toBe(1930);
    expect(customerGrossFromNetWithDiscount(1930, 0, 5, 2026)).toBe(2026);
  });

  it("uses stored variant gross for listing from-price (not 27% on net)", () => {
    const summary = listingPriceSummary(
      [
        { netPrice: 1930, grossPrice: 2026 },
        { netPrice: 2933, grossPrice: 3080 },
      ],
      5
    );
    expect(summary.unitGross).toBe(2026);
    expect(summary.unitNet).toBe(1930);
    expect(summary.vatPercent).toBe(5);
    expect(grossFromNetWithDiscount(1930, 0, 27)).toBe(2451);
  });

  it("only reports a listing price range when active variant customer prices differ", () => {
    expect(
      listingHasPriceRange(
        [
          { netPrice: 1000, grossPrice: 1270 },
          { netPrice: 1000, grossPrice: 1270 },
        ],
        27
      )
    ).toBe(false);
    expect(
      listingHasPriceRange(
        [
          { netPrice: 1000, grossPrice: 1270 },
          { netPrice: 1200, grossPrice: 1524 },
        ],
        27
      )
    ).toBe(true);
  });

  it("infers VAT from stored net+gross when product vatPercent is still 27", () => {
    expect(impliedVatPercentFromNetGross(1930, 2026)).toBe(5);
    const summary = listingPriceSummary([{ netPrice: 1930, grossPrice: 2026 }], 27);
    expect(summary.unitGross).toBe(2026);
    expect(summary.vatPercent).toBe(5);
    expect(summary.unitNet).toBe(1930);
  });

  it("returns line and total VAT breakdowns", () => {
    expect(priceBreakdownFromGross(1524, 2)).toMatchObject({
      unitNet: 1200,
      unitVat: 324,
      unitGross: 1524,
      lineNet: 2400,
      lineVat: 648,
      lineGross: 3048,
      vatPercent: 27,
    });
    expect(totalsBreakdownFromGross(1524)).toMatchObject({
      net: 1200,
      vat: 324,
      gross: 1524,
      vatPercent: 27,
    });
  });

  it("highestCartVatPercent picks max line rate with empty-cart fallback", () => {
    expect(highestCartVatPercent([{ vatPercent: 5 }])).toBe(5);
    expect(highestCartVatPercent([{ vatPercent: 5 }, { vatPercent: 27 }])).toBe(27);
    expect(highestCartVatPercent([])).toBe(27);
  });

  it("feeLineBreakdownFromGross keeps brutto but shifts net/vat with cart VAT", () => {
    const at5 = feeLineBreakdownFromGross(1000, [{ vatPercent: 5 }]);
    const at27 = feeLineBreakdownFromGross(1000, [{ vatPercent: 27 }]);
    expect(at5.gross).toBe(1000);
    expect(at27.gross).toBe(1000);
    expect(at5.net).toBeGreaterThan(at27.net);
    expect(at5.vat).toBeLessThan(at27.vat);
    expect(at5.vatPercent).toBe(5);
    expect(at27.vatPercent).toBe(27);
  });

  it("totalsBreakdownForOrderSnapshot applies highest cart VAT to shipping fee", () => {
    const breakdown = totalsBreakdownForOrderSnapshot({
      items: [{ price: 2026, quantity: 1, vatPercent: 5 }],
      subtotal: 2026,
      shippingFee: 1000,
      paymentFee: 0,
      total: 3026,
    });
    const feeOnly = feeLineBreakdownFromGross(1000, [{ vatPercent: 5 }]);
    const goods = priceBreakdownFromGross(2026, 1, 5);
    expect(breakdown.net).toBe(goods.lineNet + feeOnly.net);
    expect(breakdown.vat).toBe(goods.lineVat + feeOnly.vat);
    expect(breakdown.gross).toBe(3026);
  });
});

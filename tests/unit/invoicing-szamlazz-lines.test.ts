import { describe, expect, it } from "vitest";
import { describeInvoiceLines } from "@wse/core/services/invoicing-szamlazz";

describe("describeInvoiceLines", () => {
  it("includes product, shipping, and payment fee lines with fee VAT at cart max", () => {
    const lines = describeInvoiceLines({
      items: [
        { name: "A", price: 1000, quantity: 1, vatPercent: 5 },
        { name: "B", price: 2000, quantity: 1, vatPercent: 27 },
      ],
      shippingFee: 500,
      paymentFee: 100,
    });

    expect(lines).toHaveLength(4);
    expect(lines[0]).toMatchObject({ label: "A", vat: 5, grossUnitPrice: 1000 });
    expect(lines[1]).toMatchObject({ label: "B", vat: 27, grossUnitPrice: 2000 });
    expect(lines[2]).toMatchObject({
      label: "Szállítás",
      vat: 27,
      grossUnitPrice: 500,
      quantity: 1,
    });
    expect(lines[3]).toMatchObject({
      label: "Fizetési kezelési díj",
      vat: 27,
      grossUnitPrice: 100,
    });
  });

  it("uses 5% for fees when cart is only 5% products", () => {
    const lines = describeInvoiceLines({
      items: [{ name: "Book", price: 2026, quantity: 1, vatPercent: 5 }],
      shippingFee: 1000,
      paymentFee: 0,
    });

    expect(lines).toHaveLength(2);
    expect(lines[1]).toMatchObject({ label: "Szállítás", vat: 5, grossUnitPrice: 1000 });
  });

  it("omits zero fee lines", () => {
    const lines = describeInvoiceLines({
      items: [{ name: "X", price: 100, quantity: 1, vatPercent: 27 }],
      shippingFee: 0,
      paymentFee: 0,
    });
    expect(lines).toHaveLength(1);
  });

  it("includes variant label in product line name", () => {
    const lines = describeInvoiceLines({
      items: [
        {
          name: "Shirt",
          variantLabel: "L",
          price: 5000,
          quantity: 2,
          vatPercent: 27,
        },
      ],
      shippingFee: 0,
      paymentFee: 0,
    });
    expect(lines[0].label).toBe("Shirt [L]");
    expect(lines[0].quantity).toBe(2);
  });
});

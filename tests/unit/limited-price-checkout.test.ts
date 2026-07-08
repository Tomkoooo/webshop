import { describe, expect, it } from "vitest";
import {
  assertClientCartLinePrice,
  getStaleLimitedPriceCartMessage,
  quoteCheckoutLineForQuantity,
} from "@wse/core/lib/limited-price-checkout";

const product = {
  vatPercent: 27,
  netPrice: 5000,
  grossPrice: 6350,
  discount: 0,
  variants: [
    {
      id: "v1",
      netPrice: 5000,
      grossPrice: 6350,
      discount: 0,
      limitedPrice: {
        enabled: true,
        limitQuantity: 10,
        netPrice: 3000,
        grossPrice: 3810,
        claimedCount: 10,
      },
    },
  ],
};

describe("limited-price-checkout", () => {
  it("quotes regular price when the limited quota is exhausted", () => {
    const quote = quoteCheckoutLineForQuantity(product, "v1", 2);
    expect(quote.promoQuantity).toBe(0);
    expect(quote.regularQuantity).toBe(2);
    expect(quote.lineTotal).toBe(12_700);
  });

  it("rejects stale limited unit prices in the cart", () => {
    const quote = quoteCheckoutLineForQuantity(product, "v1", 1);
    expect(getStaleLimitedPriceCartMessage(3810, 1, quote)).toMatch(/limitált ár/);
    expect(() => assertClientCartLinePrice(3810, 1, quote)).toThrow(/limitált ár/);
  });

  it("allows checkout when the cart price matches the current quote", () => {
    const available = {
      ...product,
      variants: [
        {
          ...product.variants[0],
          limitedPrice: {
            ...product.variants[0].limitedPrice,
            claimedCount: 9,
          },
        },
      ],
    };
    const quote = quoteCheckoutLineForQuantity(available, "v1", 1);
    expect(quote.promoQuantity).toBe(1);
    expect(getStaleLimitedPriceCartMessage(3810, 1, quote)).toBeNull();
    expect(() => assertClientCartLinePrice(3810, 1, quote)).not.toThrow();
  });
});

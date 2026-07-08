import { describe, expect, it } from "vitest";
import { distributeCheckoutDiscountToItems } from "@wse/core/lib/pricing";
import { describeInvoiceLines } from "@wse/core/services/invoicing-szamlazz";

describe("distributeCheckoutDiscountToItems", () => {
  it("allocates discount across lines and preserves order total", () => {
    const items = distributeCheckoutDiscountToItems(
      [
        { name: "A", price: 1000, quantity: 2 },
        { name: "B", price: 500, quantity: 1 },
      ],
      250
    );

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    expect(subtotal).toBe(2250);
    expect(items[0].price).toBeLessThan(1000);
    expect(items[1].price).toBeLessThan(500);
  });
});

describe("invoice lines with coupon-priced items", () => {
  it("uses discounted unit prices stored on the order", () => {
    const lines = describeInvoiceLines({
      items: [{ name: "Shirt", price: 9000, quantity: 1, vatPercent: 27 }],
      shippingFee: 0,
      paymentFee: 0,
    });

    expect(lines[0].grossUnitPrice).toBe(9000);
  });
});

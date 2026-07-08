import { describe, expect, it } from "vitest";
import { applyCheckoutPriceAllocations, type ValidatedCheckoutData } from "@wse/core/services/checkout-validation";

function baseCheckoutData(): ValidatedCheckoutData {
  return {
    items: [
      {
        product: "507f1f77bcf86cd799439011",
        variantId: "size-s",
        variantLabel: "Méret: S",
        selectedAttributes: { "Méret": "S" },
        name: "Póló",
        price: 5000,
        quantity: 5,
        vatPercent: 27,
      },
    ],
    billingInfo: {
      type: "personal",
      name: "Teszt Elek",
      zip: "1111",
      city: "Budapest",
      street: "Teszt utca 1",
      email: "test@example.com",
      phone: "+361234567",
    },
    shippingAddress: {
      name: "Teszt Elek",
      zip: "1111",
      city: "Budapest",
      street: "Teszt utca 1",
      email: "test@example.com",
      phone: "+361234567",
    },
    shippingMethod: "507f1f77bcf86cd799439012",
    paymentMethod: "507f1f77bcf86cd799439013",
    couponCodes: [],
    subtotal: 25_000,
    shippingFee: 1_500,
    paymentFee: 0,
    discount: 0,
    total: 26_500,
    paymentProvider: "standard",
    saveAddressToProfile: false,
    billingCountry: "Magyarország",
    shippingCountry: "Magyarország",
    billingCountryCode: "HU",
    shippingCountryCode: "HU",
  };
}

describe("limited checkout price allocations", () => {
  it("splits a variant line when only part of the quantity receives the limited price", () => {
    const result = applyCheckoutPriceAllocations(baseCheckoutData(), [
      {
        promoQuantity: 2,
        regularQuantity: 3,
        promoUnitPrice: 3000,
        regularUnitPrice: 5000,
      },
    ]);

    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({ quantity: 2, price: 3000 });
    expect(result.items[1]).toMatchObject({ quantity: 3, price: 5000 });
    expect(result.subtotal).toBe(21_000);
    expect(result.total).toBe(22_500);
  });
});

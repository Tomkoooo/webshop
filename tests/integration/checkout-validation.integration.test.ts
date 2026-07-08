import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "../setup/mongo-memory";
import Product from "@wse/core/models/Product";
import ShippingMethod from "@wse/core/models/ShippingMethod";
import PaymentMethod from "@wse/core/models/PaymentMethod";
import { vi } from "vitest";

describe("checkout validation integration", () => {
  let productId: string;
  let shippingMethodId: string;
  let paymentMethodId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  }, 30000);

  afterAll(async () => {
    await disconnectTestDatabase();
  }, 30000);

  beforeEach(async () => {
    vi.resetModules();
    await clearTestDatabase();

    const shippingMethod = await ShippingMethod.create({
      name: "Hazhozszallitas",
      grossPrice: 1500,
      isActive: true,
    });
    shippingMethodId = shippingMethod._id.toString();

    const paymentMethod = await PaymentMethod.create({
      name: "Utalas",
      grossPrice: 0,
      isActive: true,
    });
    paymentMethodId = paymentMethod._id.toString();

    const product = await Product.create({
      name: "Teszt termek",
      images: [],
      description: "Leiras",
      stock: 10,
      netPrice: 1000,
      discount: 0,
      category: new mongoose.Types.ObjectId(),
      slug: "teszt-termek",
      isActive: true,
      isVisible: true,
      variantOptions: [],
      variants: [],
      ratings: [],
    });
    productId = product._id.toString();
  });

  it("normalizes valid checkout payload and calculates totals", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    const result = await validateAndNormalizeCheckoutInput({
      items: [{ product: productId, quantity: 2 }],
      billingInfo: {
        type: "personal",
        name: "Teszt Elek",
        zip: "1111",
        city: "Budapest",
        street: "Fo utca 1",
        email: "test@example.com",
        phone: "+3611111111",
      },
      shippingAddress: {
        name: "Teszt Elek",
        zip: "1111",
        city: "Budapest",
        street: "Fo utca 1",
        email: "test@example.com",
        phone: "+3611111111",
      },
      shippingMethod: shippingMethodId,
      paymentMethod: paymentMethodId,
    });

    expect(result.shippingMethod).toBe(shippingMethodId);
    expect(result.paymentMethod).toBe(paymentMethodId);
    expect(result.total).toBeGreaterThan(0);
    expect(result.items).toHaveLength(1);
    expect(result.saveAddressToProfile).toBe(false);
    expect(result.billingCountry).toBe("Magyarország");
  });

  it("rejects empty cart", async () => {
    const { validateAndNormalizeCheckoutInput } = await import("@wse/core/services/checkout-validation");
    await expect(
      validateAndNormalizeCheckoutInput({
        items: [],
        billingInfo: {
          type: "personal",
          name: "Teszt Elek",
          zip: "1111",
          city: "Budapest",
          street: "Fo utca 1",
          email: "test@example.com",
          phone: "+3611111111",
        },
        shippingAddress: {
          name: "Teszt Elek",
          zip: "1111",
          city: "Budapest",
          street: "Fo utca 1",
          email: "test@example.com",
          phone: "+3611111111",
        },
        shippingMethod: shippingMethodId,
        paymentMethod: paymentMethodId,
      })
    ).rejects.toThrow("A kosár üres");
  });
});

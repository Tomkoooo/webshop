import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "../setup/mongo-memory";
import Product from "@wse/core/models/Product";
import User from "@wse/core/models/User";

describe("CartService variant persistence", () => {
  let userId: string;
  let productId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  }, 60000);

  afterAll(async () => {
    await disconnectTestDatabase();
  }, 60000);

  beforeEach(async () => {
    await clearTestDatabase();
    const user = await User.create({
      name: "Teszt",
      email: `cart-${Date.now()}@test.local`,
    });
    userId = user._id.toString();

    const cat = new mongoose.Types.ObjectId();
    const product = await Product.create({
      name: "Képregény",
      images: [],
      description: "x",
      stock: 2,
      netPrice: 1000,
      discount: 0,
      category: cat,
      slug: `comic-${Date.now()}`,
      isActive: true,
      isVisible: true,
      requireVariantSelection: true,
      uniqueNumberedVariants: { enabled: true, attributeName: "Szám", maxQuantityPerLine: 1 },
      variantOptions: [{ name: "Szám", values: ["36", "37"] }],
      variants: [
        { id: "num-36", attributes: { Szám: "36" }, netPrice: 1000, discount: 0, stock: 1, isActive: true },
        { id: "num-37", attributes: { Szám: "37" }, netPrice: 1000, discount: 0, stock: 1, isActive: true },
      ],
      ratings: [],
    });
    productId = product._id.toString();
  });

  it("keeps two variant lines for the same product", async () => {
    const { CartService } = await import("@wse/core/services/cart");
    await CartService.replaceCart(userId, [
      { id: `${productId}:num-36`, productId, variantId: "num-36", quantity: 1 },
      { id: `${productId}:num-37`, productId, variantId: "num-37", quantity: 1 },
    ]);
    const cart = await CartService.getCart(userId);
    expect(cart.items).toHaveLength(2);
    expect(cart.items.map((i: { variantId?: string }) => i.variantId).sort()).toEqual(["num-36", "num-37"]);
  });

  it("drops sold-out variant lines", async () => {
    const { CartService } = await import("@wse/core/services/cart");
    await Product.updateOne(
      { _id: productId, "variants.id": "num-36" },
      { $set: { "variants.$.stock": 0 } }
    );
    await CartService.replaceCart(userId, [
      { id: `${productId}:num-36`, productId, variantId: "num-36", quantity: 1 },
      { id: `${productId}:num-37`, productId, variantId: "num-37", quantity: 1 },
    ]);
    const cart = await CartService.getCart(userId);
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].variantId).toBe("num-37");
  });

  it("caps quantity to 1 for unique numbered products", async () => {
    const { CartService } = await import("@wse/core/services/cart");
    await CartService.replaceCart(userId, [
      { id: `${productId}:num-36`, productId, variantId: "num-36", quantity: 5 },
    ]);
    const cart = await CartService.getCart(userId);
    expect(cart.items[0].quantity).toBe(1);
  });
});

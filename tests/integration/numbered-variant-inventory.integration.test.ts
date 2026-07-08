import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "../setup/mongo-memory";
import Product from "@wse/core/models/Product";
import {
  allocateReservationsForStripeTempOrder,
  InventoryReservationError,
} from "@wse/core/services/inventory-reservation";
import { getCartLineOrderabilityMessage } from "@wse/core/lib/cart-line-orderability";

describe("numbered variant inventory integration", () => {
  let productId: string;

  beforeAll(async () => {
    await connectTestDatabase();
  }, 60000);

  afterAll(async () => {
    await disconnectTestDatabase();
  }, 60000);

  beforeEach(async () => {
    await clearTestDatabase();
    const cat = new mongoose.Types.ObjectId();
    const product = await Product.create({
      name: "Képregény",
      images: [],
      description: "x",
      stock: 3,
      netPrice: 1000,
      discount: 0,
      category: cat,
      slug: `numbered-${Date.now()}`,
      isActive: true,
      isVisible: true,
      requireVariantSelection: true,
      uniqueNumberedVariants: { enabled: true, attributeName: "Szám", maxQuantityPerLine: 1 },
      variantOptions: [{ name: "Szám", values: ["36", "37", "38"] }],
      variants: [
        { id: "num-36", attributes: { Szám: "36" }, netPrice: 1000, discount: 0, stock: 1, isActive: true },
        { id: "num-37", attributes: { Szám: "37" }, netPrice: 1000, discount: 0, stock: 1, isActive: true },
        { id: "num-38", attributes: { Szám: "38" }, netPrice: 1000, discount: 0, stock: 1, isActive: true },
      ],
      ratings: [],
    });
    productId = product._id.toString();
  });

  it("reports sold-out after stock decrement", async () => {
    const product = await Product.findById(productId).lean();
    expect(
      getCartLineOrderabilityMessage(
        { productId, variantId: "num-36", quantity: 1 },
        product as never
      )
    ).toBeNull();

    await Product.updateOne(
      { _id: productId, "variants.id": "num-36" },
      { $set: { "variants.$.stock": 0 } }
    );

    const updated = await Product.findById(productId).lean();
    expect(
      getCartLineOrderabilityMessage(
        { productId, variantId: "num-36", quantity: 1 },
        updated as never
      )
    ).toMatch(/nincs raktáron/i);
  });

  it("allows only one reservation per issue number under concurrency", async () => {
    const attempts = 30;
    const results = await Promise.all(
      Array.from({ length: attempts }, async () => {
        const tempOrderId = new mongoose.Types.ObjectId();
        try {
          await allocateReservationsForStripeTempOrder(tempOrderId, [
            { product: productId, variantId: "num-37", quantity: 1 },
          ]);
          return "ok" as const;
        } catch (e) {
          if (e instanceof InventoryReservationError && e.code === "INSUFFICIENT_STOCK") {
            return "sold" as const;
          }
          throw e;
        }
      })
    );

    expect(results.filter((r) => r === "ok").length).toBe(1);
    const p = await Product.findById(productId).lean();
    const v37 = (p?.variants as { id: string; stock: number }[] | undefined)?.find((x) => x.id === "num-37");
    expect(v37?.stock).toBe(0);
  });
});

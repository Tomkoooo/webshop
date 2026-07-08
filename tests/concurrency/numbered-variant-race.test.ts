import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { clearTestDatabase, connectTestDatabase, disconnectTestDatabase } from "../setup/mongo-memory";
import {
  attemptStripeReservation,
  countReservationResults,
  runConcurrentReservationAttempts,
} from "../helpers/inventory-race";
import Product from "@wse/core/models/Product";
import { expandNumberRanges, ELADHATO_NUMBER_RANGES } from "@wse/core/lib/numbered-variant-ranges";

function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("numbered variant race (mongodb)", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectTestDatabase();
  }, 120_000);

  describe("preset range sample", () => {
    it("ELADHATO preset expands to 369 numbers", () => {
      expect(expandNumberRanges(ELADHATO_NUMBER_RANGES)).toHaveLength(369);
    });
  });

  describe("single issue number stock 1", () => {
    let productId: string;

    beforeEach(async () => {
      await clearTestDatabase();
      const cat = new mongoose.Types.ObjectId();
      const p = await Product.create({
        name: "Numbered comic",
        images: [],
        description: "x",
        stock: 1,
        netPrice: 1000,
        discount: 0,
        category: cat,
        slug: uniqueSlug("numbered-race"),
        isActive: true,
        isVisible: true,
        requireVariantSelection: true,
        uniqueNumberedVariants: { enabled: true, attributeName: "Szám", maxQuantityPerLine: 1 },
        variantOptions: [{ name: "Szám", values: ["42"] }],
        variants: [
          {
            id: "num-42",
            attributes: { Szám: "42" },
            netPrice: 1000,
            discount: 0,
            stock: 1,
            isActive: true,
          },
        ],
        ratings: [],
      });
      productId = p._id.toString();
    }, 30_000);

    it("allows at most one concurrent reservation for issue 42", async () => {
      const attempts = 40;
      const results = await runConcurrentReservationAttempts(attempts, () =>
        attemptStripeReservation(productId, { variantId: "num-42", quantity: 1 })
      );

      expect(countReservationResults(results).wins).toBe(1);
      expect(countReservationResults(results).sold).toBe(attempts - 1);

      const snapshot = await Product.findById(productId).lean();
      const v = (snapshot?.variants as { id: string; stock: number }[] | undefined)?.find(
        (x) => x.id === "num-42"
      );
      expect(v?.stock).toBe(0);
      expect((snapshot?.stock ?? 0) >= 0).toBe(true);
    }, 60_000);
  });
});

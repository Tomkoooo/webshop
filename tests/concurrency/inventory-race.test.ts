import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import {
  clearTestDatabase,
  connectTestDatabase,
  disconnectTestDatabase,
  ensureTestDatabaseReady,
} from "../setup/mongo-memory";
import {
  attemptStripeReservation,
  countReservationResults,
  runConcurrentReservationAttempts,
} from "../helpers/inventory-race";
import Product from "@wse/core/models/Product";
import Reservation from "@wse/core/models/Reservation";
import StripeWebhookEvent from "@wse/core/models/StripeWebhookEvent";
import {
  allocateReservationsForStripeTempOrder,
  InventoryReservationError,
  sweepExpiredPendingReservations,
} from "@wse/core/services/inventory-reservation";

function uniqueSlug(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createLimitedProduct(stock: number) {
  const cat = new mongoose.Types.ObjectId();
  return Product.create({
    name: "Limited",
    images: [],
    description: "x",
    stock,
    netPrice: 1000,
    discount: 0,
    category: cat,
    slug: uniqueSlug("limited"),
    isActive: true,
    isVisible: true,
    variantOptions: [],
    variants: [],
    ratings: [],
  });
}

describe("inventory reservation concurrency (mongodb-memory-server)", () => {
  beforeAll(async () => {
    await connectTestDatabase();
  }, 120_000);

  afterAll(async () => {
    await disconnectTestDatabase();
  }, 120_000);

  describe("last unit (stock 1)", () => {
    let productId: string;

    beforeEach(async () => {
      await ensureTestDatabaseReady();
      await clearTestDatabase();
      const p = await createLimitedProduct(1);
      productId = p._id.toString();
    }, 30_000);

    it("allows at most one concurrent reservation for the last unit", async () => {
      await ensureTestDatabaseReady();
      const attempts = 40;
      const results = await runConcurrentReservationAttempts(attempts, () =>
        attemptStripeReservation(productId, { quantity: 1 })
      );

      expect(countReservationResults(results).wins).toBe(1);

      const p = await Product.findById(productId).lean();
      expect(p?.stock).toBe(0);
      expect((p?.stock ?? 0) >= 0).toBe(true);

      const pending = await Reservation.countDocuments({ state: "pending" });
      expect(pending).toBe(1);
    }, 60_000);

    it("rolls back entire cart when any line cannot be reserved", async () => {
      await ensureTestDatabaseReady();
      const cat = new mongoose.Types.ObjectId();
      const empty = await Product.create({
        name: "Empty",
        images: [],
        description: "x",
        stock: 0,
        netPrice: 500,
        discount: 0,
        category: cat,
        slug: uniqueSlug("empty"),
        isActive: true,
        isVisible: true,
        variantOptions: [],
        variants: [],
        ratings: [],
      });

      await ensureTestDatabaseReady();
      expect(await Product.countDocuments({})).toBe(2);

      const tempOrderId = new mongoose.Types.ObjectId();
      await expect(
        allocateReservationsForStripeTempOrder(tempOrderId, [
          { product: productId, quantity: 1 },
          { product: empty._id.toString(), quantity: 1 },
        ])
      ).rejects.toBeInstanceOf(InventoryReservationError);

      const p = await Product.findById(productId).lean();
      expect(p).not.toBeNull();
      expect(p?.stock).toBe(1);
      expect(await Reservation.countDocuments({})).toBe(0);
    }, 30_000);

    it("sweepExpiredPendingReservations restores stock idempotently", async () => {
      const tempOrderId = new mongoose.Types.ObjectId();
      await allocateReservationsForStripeTempOrder(tempOrderId, [{ product: productId, quantity: 1 }]);
      await Reservation.updateMany(
        { tempOrder: tempOrderId },
        { $set: { expiresAt: new Date(Date.now() - 60_000) } }
      );

      const n1 = await sweepExpiredPendingReservations(new Date());
      expect(n1).toBe(1);

      const p = await Product.findById(productId).lean();
      expect(p?.stock).toBe(1);

      const n2 = await sweepExpiredPendingReservations(new Date());
      expect(n2).toBe(0);
    }, 30_000);
  });

  describe("repeated last-unit races (flakiness detector)", () => {
    const rounds = 20;
    const attemptsPerRound = 40;

    it(`each of ${rounds} rounds has exactly one winner and non-negative stock`, async () => {
      for (let r = 0; r < rounds; r++) {
        await clearTestDatabase();
        const p = await createLimitedProduct(1);
        const pid = p._id.toString();

        const results = await runConcurrentReservationAttempts(attemptsPerRound, () =>
          attemptStripeReservation(pid, { quantity: 1 })
        );

        const snapshot = await Product.findById(pid).lean();
        expect((snapshot?.stock ?? -1) >= 0).toBe(true);

        expect(countReservationResults(results).wins).toBe(1);
        expect(countReservationResults(results).sold).toBe(attemptsPerRound - 1);

        const finalP = await Product.findById(pid).lean();
        expect(finalP?.stock).toBe(0);
        expect(await Reservation.countDocuments({ state: "pending", product: pid })).toBe(1);
      }
    }, 120_000);
  });

  describe("multi-winner (stock 2)", () => {
    let productId: string;

    beforeEach(async () => {
      await clearTestDatabase();
      const p = await createLimitedProduct(2);
      productId = p._id.toString();
    }, 30_000);

    it("allows exactly two concurrent reservations when two units exist", async () => {
      const attempts = 60;
      const results = await runConcurrentReservationAttempts(attempts, () =>
        attemptStripeReservation(productId, { quantity: 1 })
      );

      expect(countReservationResults(results).wins).toBe(2);
      expect(countReservationResults(results).sold).toBe(attempts - 2);

      const p = await Product.findById(productId).lean();
      expect(p?.stock).toBe(0);
      expect((p?.stock ?? 0) >= 0).toBe(true);
      expect(await Reservation.countDocuments({ state: "pending", product: productId })).toBe(2);
    }, 60_000);
  });

  describe("variant last unit", () => {
    let productId: string;

    beforeEach(async () => {
      await clearTestDatabase();
      const cat = new mongoose.Types.ObjectId();
      const p = await Product.create({
        name: "Variant limited",
        images: [],
        description: "x",
        stock: 1,
        netPrice: 1000,
        discount: 0,
        category: cat,
        slug: uniqueSlug("var-lim"),
        isActive: true,
        isVisible: true,
        variantOptions: [{ name: "Size", values: ["S"] }],
        variants: [
          {
            id: "v1",
            attributes: { Size: "S" },
            netPrice: 1000,
            discount: 0,
            stock: 1,
            isActive: true,
          },
        ],
        requireVariantSelection: true,
        ratings: [],
      });
      productId = p._id.toString();
    }, 30_000);

    it("allows at most one concurrent reservation for the last variant unit", async () => {
      const attempts = 40;
      const results = await runConcurrentReservationAttempts(attempts, () =>
        attemptStripeReservation(productId, { variantId: "v1", quantity: 1 })
      );

      expect(countReservationResults(results).wins).toBe(1);
      expect(countReservationResults(results).sold).toBe(attempts - 1);

      const p = await Product.findById(productId).lean();
      const v = (p?.variants as { id: string; stock: number }[] | undefined)?.find((x) => x.id === "v1");
      expect(v?.stock).toBe(0);
      expect(p?.stock).toBe(0);

      expect(await Reservation.countDocuments({ state: "pending", product: productId, variantId: "v1" })).toBe(
        1
      );
    }, 60_000);
  });

  describe("variant limited price quota", () => {
    beforeEach(async () => {
      await clearTestDatabase();
    }, 30_000);

    it("does not allocate the 3rd variant unit to a first-2 limited price under concurrency", async () => {
      const cat = new mongoose.Types.ObjectId();
      const product = await Product.create({
        name: "Variant promo quota",
        images: [],
        description: "x",
        stock: 3,
        netPrice: 5000,
        discount: 0,
        category: cat,
        slug: uniqueSlug("var-promo"),
        isActive: true,
        isVisible: true,
        variantOptions: [{ name: "Size", values: ["S"] }],
        variants: [
          {
            id: "v1",
            attributes: { Size: "S" },
            netPrice: 5000,
            grossPrice: 5000,
            discount: 0,
            stock: 3,
            isActive: true,
            limitedPrice: {
              enabled: true,
              limitQuantity: 2,
              netPrice: 3000,
              grossPrice: 3000,
              reservedCount: 0,
              soldCount: 0,
              claimedCount: 0,
            },
          },
        ],
        requireVariantSelection: true,
        ratings: [],
      });

      const results = await Promise.all(
        Array.from({ length: 3 }, async () => {
          const tempOrderId = new mongoose.Types.ObjectId();
          const result = await allocateReservationsForStripeTempOrder(tempOrderId, [
            { product: product._id.toString(), variantId: "v1", quantity: 1 },
          ]);
          return result.allocations[0].promoQuantity;
        })
      );

      expect(results.reduce((sum, qty) => sum + qty, 0)).toBe(2);
      expect(results.filter((qty) => qty === 0)).toHaveLength(1);

      const snapshot = await Product.findById(product._id).lean();
      const variant = (snapshot?.variants as { id: string; stock?: number; limitedPrice?: { claimedCount?: number; reservedCount?: number } }[] | undefined)?.find((v) => v.id === "v1");
      expect(variant?.stock).toBe(0);
      expect(variant?.limitedPrice?.claimedCount).toBe(2);
      expect(variant?.limitedPrice?.reservedCount).toBe(2);
      expect(await Reservation.countDocuments({ product: product._id, variantId: "v1", promoQuantity: 1 })).toBe(2);
    }, 30_000);
  });

  describe("Stripe webhook idempotency (mongo)", () => {
    beforeEach(async () => {
      await clearTestDatabase();
    }, 30_000);

    it("Stripe webhook dedup collection rejects duplicate stripeEventId", async () => {
      await StripeWebhookEvent.create([
        { stripeEventId: "evt_dup_1", type: "checkout.session.completed", status: "processed" },
      ]);
      await expect(
        StripeWebhookEvent.create([
          { stripeEventId: "evt_dup_1", type: "checkout.session.completed", status: "processing" },
        ])
      ).rejects.toThrow();
    });
  });
});

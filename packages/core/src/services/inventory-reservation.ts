import mongoose, { ClientSession } from "mongoose";
import Product from "@wse/core/models/Product";
import Reservation from "@wse/core/models/Reservation";
import { reservationEndsAt, resolveReservationTtlMs } from "@wse/core/services/reservation-ttl";
import {
  getLimitedPromoRemaining,
  resolvePromoUnitPrice,
  resolveRegularUnitPrice,
  type LimitedPriceCounter,
  type LimitedPriceRecord,
} from "@wse/core/lib/limited-price-checkout";

export class InventoryReservationError extends Error {
  constructor(
    message: string,
    public readonly code: "INSUFFICIENT_STOCK" | "TRANSACTION_FAILED" = "INSUFFICIENT_STOCK"
  ) {
    super(message);
    this.name = "InventoryReservationError";
  }
}

export type CheckoutReserveItem = {
  product: string;
  variantId?: string;
  quantity: number;
  promoQuantity?: number;
  promoCounter?: LimitedPriceCounter;
};

export type CheckoutStockAllocation = {
  product: string;
  variantId?: string;
  quantity: number;
  promoQuantity: number;
  regularQuantity: number;
  promoUnitPrice?: number;
  regularUnitPrice?: number;
  vatPercent?: number;
};

function sessionOpt(session?: ClientSession | null): { session?: ClientSession } {
  return session ? { session } : {};
}

async function syncVariantAggregateStock(
  productId: mongoose.Types.ObjectId,
  session?: ClientSession | null
) {
  const q = Product.findById(productId);
  const p = session ? await q.session(session).lean() : await q.lean();
  if (!p || !Array.isArray((p as any).variants) || (p as any).variants.length === 0) return;
  const sum = (p as any).variants.reduce((s: number, v: any) => s + (v.stock || 0), 0);
  await Product.updateOne({ _id: productId }, { $set: { stock: sum } }, sessionOpt(session));
}

/**
 * Atomic single-line stock decrement. Optional Mongo session (omit on standalone / memory server).
 */
export async function decrementCheckoutLineStock(
  session: ClientSession | null | undefined,
  item: CheckoutReserveItem
): Promise<CheckoutStockAllocation> {
  const productId = new mongoose.Types.ObjectId(item.product);
  const qty = item.quantity;
  if (!Number.isFinite(qty) || qty < 1) {
    throw new InventoryReservationError("Érvénytelen mennyiség a foglaláshoz");
  }

  const q = Product.findById(productId);
  const product = session ? await q.session(session).lean() : await q.lean();
  if (!product) throw new InventoryReservationError("A termék nem található");
  if (!product.isActive || !product.isVisible) {
    throw new InventoryReservationError("A termék már nem elérhető");
  }

  const hasVariants = Array.isArray((product as any).variants) && (product as any).variants.length > 0;
  const requireVariantSelection = Boolean((product as any).requireVariantSelection) && hasVariants;

  if (item.variantId) {
    if (!hasVariants) throw new InventoryReservationError("Érvénytelen variáns");
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const latestQuery = Product.findById(productId);
      const latest = session ? await latestQuery.session(session).lean() : await latestQuery.lean();
      const variant = (latest as any)?.variants?.find((v: any) => v.id === item.variantId);
      if (!latest || !variant || variant.isActive === false) {
        throw new InventoryReservationError("A kiválasztott variáns nem elérhető");
      }
      const regular = resolveRegularUnitPrice(latest, variant);
      const counter = item.promoCounter;
      const promo = counter ? resolvePromoUnitPrice(latest, variant.limitedPrice) : null;
      const promoQuantity = promo ? Math.min(qty, getLimitedPromoRemaining(variant.limitedPrice)) : 0;
      const inc: Record<string, number> = { "variants.$[v].stock": -qty };
      const elemMatch: Record<string, unknown> = {
        id: item.variantId,
        stock: { $gte: qty },
        isActive: { $ne: false },
      };
      if (promoQuantity > 0 && counter) {
        inc["variants.$[v].limitedPrice.claimedCount"] = promoQuantity;
        inc[`variants.$[v].limitedPrice.${counter}Count`] = promoQuantity;
        elemMatch["limitedPrice.enabled"] = true;
        elemMatch["limitedPrice.claimedCount"] = {
          $lte: Math.max(0, Number(variant.limitedPrice?.limitQuantity || 0) - promoQuantity),
        };
      }
      const filter = { _id: productId, isActive: true, isVisible: true, variants: { $elemMatch: elemMatch } };
      const update = { $inc: inc };
      const opts = {
        ...sessionOpt(session),
        arrayFilters: [{ "v.id": item.variantId, "v.stock": { $gte: qty } }],
      };
      // Mongoose bundles mongodb types that diverge from top-level `mongodb`; avoid cross-package ClientSession friction.
      const res = await Product.collection.updateOne(filter, update, opts as Parameters<typeof Product.collection.updateOne>[2]);
      if (res.modifiedCount === 1) {
        await syncVariantAggregateStock(productId, session);
        return {
          product: item.product,
          variantId: item.variantId,
          quantity: qty,
          promoQuantity,
          regularQuantity: qty - promoQuantity,
          promoUnitPrice: promoQuantity > 0 ? promo?.unitPrice : undefined,
          regularUnitPrice: regular.unitPrice,
          vatPercent: regular.vatPercent,
        };
      }
    }
    throw new InventoryReservationError("Nincs elég készlet vagy limitált ár a kiválasztott variánshoz", "INSUFFICIENT_STOCK");
  }

  if (requireVariantSelection) {
    throw new InventoryReservationError("Válassz variánst a termékhez");
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const latestQuery = Product.findById(productId);
    const latest = session ? await latestQuery.session(session).lean() : await latestQuery.lean();
    if (!latest || !latest.isActive || !latest.isVisible) {
      throw new InventoryReservationError("A termék már nem elérhető");
    }
    const regular = resolveRegularUnitPrice(latest, latest);
    const counter = item.promoCounter;
    const promo = counter ? resolvePromoUnitPrice(latest, (latest as { limitedPrice?: LimitedPriceRecord }).limitedPrice) : null;
    const promoQuantity = promo
      ? Math.min(qty, getLimitedPromoRemaining((latest as { limitedPrice?: LimitedPriceRecord }).limitedPrice))
      : 0;
    const inc: Record<string, number> = { stock: -qty };
    const filter: Record<string, unknown> = {
      _id: productId,
      isActive: true,
      isVisible: true,
      stock: { $gte: qty },
    };
    if (promoQuantity > 0 && counter) {
      inc["limitedPrice.claimedCount"] = promoQuantity;
      inc[`limitedPrice.${counter}Count`] = promoQuantity;
      filter["limitedPrice.enabled"] = true;
      filter["limitedPrice.claimedCount"] = {
        $lte: Math.max(0, Number((latest as { limitedPrice?: { limitQuantity?: number } }).limitedPrice?.limitQuantity || 0) - promoQuantity),
      };
    }
    const updatedRoot = await Product.findOneAndUpdate(filter, { $inc: inc }, { ...sessionOpt(session), returnDocument: "after" });
    if (updatedRoot) {
      if (hasVariants) {
        await syncVariantAggregateStock(productId, session);
      }
      return {
        product: item.product,
        quantity: qty,
        promoQuantity,
        regularQuantity: qty - promoQuantity,
        promoUnitPrice: promoQuantity > 0 ? promo?.unitPrice : undefined,
        regularUnitPrice: regular.unitPrice,
        vatPercent: regular.vatPercent,
      };
    }
  }
  throw new InventoryReservationError("Nincs elég készlet vagy limitált ár", "INSUFFICIENT_STOCK");
}

async function restoreLineStock(
  session: ClientSession | undefined | null,
  productId: mongoose.Types.ObjectId,
  variantId: string | undefined,
  qty: number,
  promo?: { promoQuantity?: number; promoCounter?: "reserved" | "sold" }
) {
  if (variantId) {
    const promoQuantity = Math.max(0, Math.round(Number(promo?.promoQuantity || 0)));
    const promoCounter = promo?.promoCounter;
    const inc: Record<string, number> = { "variants.$[v].stock": qty };
    if (promoQuantity > 0 && promoCounter) {
      inc["variants.$[v].limitedPrice.claimedCount"] = -promoQuantity;
      inc[`variants.$[v].limitedPrice.${promoCounter}Count`] = -promoQuantity;
    }
    await Product.findOneAndUpdate(
      { _id: productId },
      { $inc: inc },
      { arrayFilters: [{ "v.id": variantId }], ...sessionOpt(session) }
    );
    await syncVariantAggregateStock(productId, session ?? null);
  } else {
    const promoQuantity = Math.max(0, Math.round(Number(promo?.promoQuantity || 0)));
    const promoCounter = promo?.promoCounter;
    const inc: Record<string, number> = { stock: qty };
    if (promoQuantity > 0 && promoCounter) {
      inc["limitedPrice.claimedCount"] = -promoQuantity;
      inc[`limitedPrice.${promoCounter}Count`] = -promoQuantity;
    }
    await Product.updateOne({ _id: productId }, { $inc: inc }, sessionOpt(session));
  }
}

/** Undo a successful `decrementCheckoutLineStock` (e.g. multi-line COD rollback). */
export async function restoreCheckoutLineStock(item: CheckoutReserveItem): Promise<void> {
  const productId = new mongoose.Types.ObjectId(item.product);
  await restoreLineStock(undefined, productId, item.variantId, item.quantity, {
    promoQuantity: item.promoQuantity,
    promoCounter: item.promoCounter,
  });
}

type AppliedLine = {
  productId: mongoose.Types.ObjectId;
  variantId?: string;
  quantity: number;
  promoQuantity: number;
  reservationId: mongoose.Types.ObjectId;
};

/**
 * Holds stock for all cart lines (all-or-nothing) using per-document atomic updates.
 * Works on standalone MongoDB (no multi-document transaction requirement).
 */
export async function allocateReservationsForStripeTempOrder(
  tempOrderId: mongoose.Types.ObjectId,
  items: CheckoutReserveItem[],
  options?: { serverNow?: Date; requestedTtlMs?: number | null }
): Promise<{ expiresAt: Date; ttlMs: number; allocations: CheckoutStockAllocation[] }> {
  const now = options?.serverNow ?? new Date();
  const ttlMs = await resolveReservationTtlMs(options?.requestedTtlMs ?? undefined);
  const expiresAt = reservationEndsAt(now, ttlMs);

  const applied: AppliedLine[] = [];
  const allocations: CheckoutStockAllocation[] = [];

  try {
    for (const item of items) {
      if (!mongoose.Types.ObjectId.isValid(item.product)) {
        throw new InventoryReservationError("Érvénytelen termékazonosító");
      }
      const productId = new mongoose.Types.ObjectId(item.product);
      const allocation = await decrementCheckoutLineStock(undefined, { ...item, promoCounter: "reserved" });
      allocations.push(allocation);
      const [doc] = await Reservation.create([
        {
          tempOrder: tempOrderId,
          product: productId,
          variantId: item.variantId,
          quantity: item.quantity,
          promoQuantity: allocation.promoQuantity,
          promoUnitPrice: allocation.promoUnitPrice,
          regularUnitPrice: allocation.regularUnitPrice,
          state: "pending",
          expiresAt,
        },
      ]);
      applied.push({
        productId,
        variantId: item.variantId,
        quantity: item.quantity,
        promoQuantity: allocation.promoQuantity,
        reservationId: doc._id as mongoose.Types.ObjectId,
      });
    }
    return { expiresAt, ttlMs, allocations };
  } catch (e) {
    for (const a of applied.reverse()) {
      await restoreLineStock(undefined, a.productId, a.variantId, a.quantity, {
        promoQuantity: a.promoQuantity,
        promoCounter: "reserved",
      });
      await Reservation.deleteOne({ _id: a.reservationId });
    }
    if (e instanceof InventoryReservationError) throw e;
    throw new InventoryReservationError(
      e instanceof Error ? e.message : "Foglalás sikertelen",
      "TRANSACTION_FAILED"
    );
  }
}

/**
 * Restores stock for reservations in the given states (default pending + confirmed for refund path).
 */
export async function releaseReservationsForTempOrder(
  tempOrderId: mongoose.Types.ObjectId | string,
  options?: { states?: Array<"pending" | "confirmed"> }
): Promise<number> {
  const states = options?.states ?? ["pending", "confirmed"];
  const tid = typeof tempOrderId === "string" ? new mongoose.Types.ObjectId(tempOrderId) : tempOrderId;

  const rows = await Reservation.find({ tempOrder: tid, state: { $in: states } }).lean();
  let count = 0;
  for (const r of rows) {
    const updated = await Reservation.findOneAndUpdate(
      { _id: r._id, state: { $in: states } },
      { $set: { state: "released" } },
      { returnDocument: "after" }
    );
    if (!updated) continue;
    await restoreLineStock(undefined, r.product as mongoose.Types.ObjectId, r.variantId, r.quantity, {
      promoQuantity: r.promoQuantity,
      promoCounter: r.state === "confirmed" ? "sold" : "reserved",
    });
    count += 1;
  }
  return count;
}

export async function confirmPendingReservationsForTempOrder(tempOrderId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(tempOrderId)) return;
  const tid = new mongoose.Types.ObjectId(tempOrderId);
  const rows = await Reservation.find({ tempOrder: tid, state: "pending" }).lean();
  for (const r of rows) {
    const updated = await Reservation.findOneAndUpdate(
      { _id: r._id, state: "pending" },
      { $set: { state: "confirmed" } },
      { returnDocument: "after" }
    );
    if (!updated || !r.promoQuantity) continue;
    if (r.variantId) {
      await Product.updateOne(
        { _id: r.product },
        {
          $inc: {
            "variants.$[v].limitedPrice.reservedCount": -r.promoQuantity,
            "variants.$[v].limitedPrice.soldCount": r.promoQuantity,
          },
        },
        { arrayFilters: [{ "v.id": r.variantId }] }
      );
    } else {
      await Product.updateOne(
        { _id: r.product },
        {
          $inc: {
            "limitedPrice.reservedCount": -r.promoQuantity,
            "limitedPrice.soldCount": r.promoQuantity,
          },
        }
      );
    }
  }
}

export async function markReservationsExpiredForTempOrder(tempOrderId: string): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(tempOrderId)) return;
  const tid = new mongoose.Types.ObjectId(tempOrderId);
  await Reservation.updateMany(
    { tempOrder: tid, state: "pending" },
    { $set: { state: "expired" } }
  );
}

/** Sweeper: release pending reservations past expiresAt (idempotent per row). */
export async function sweepExpiredPendingReservations(now: Date = new Date()): Promise<number> {
  const expired = await Reservation.find({ state: "pending", expiresAt: { $lt: now } }).lean();
  let total = 0;
  for (const r of expired) {
    const updated = await Reservation.findOneAndUpdate(
      { _id: r._id, state: "pending" },
      { $set: { state: "released" } },
      { returnDocument: "after" }
    );
    if (!updated) continue;
    await restoreLineStock(undefined, r.product as mongoose.Types.ObjectId, r.variantId, r.quantity, {
      promoQuantity: r.promoQuantity,
      promoCounter: "reserved",
    });
    total += 1;
  }
  return total;
}

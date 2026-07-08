import mongoose from "mongoose";
import {
  allocateReservationsForStripeTempOrder,
  InventoryReservationError,
  type CheckoutReserveItem,
} from "@wse/core/services/inventory-reservation";

export type ReservationAttemptResult = "ok" | "sold";

export async function attemptStripeReservation(
  productId: string,
  line: Omit<CheckoutReserveItem, "product">
): Promise<ReservationAttemptResult> {
  const tempOrderId = new mongoose.Types.ObjectId();
  try {
    await allocateReservationsForStripeTempOrder(tempOrderId, [{ product: productId, ...line }]);
    return "ok";
  } catch (e) {
    if (e instanceof InventoryReservationError && e.code === "INSUFFICIENT_STOCK") {
      return "sold";
    }
    throw e;
  }
}

export async function runConcurrentReservationAttempts(
  attempts: number,
  runOne: () => Promise<ReservationAttemptResult>
): Promise<ReservationAttemptResult[]> {
  return Promise.all(Array.from({ length: attempts }, () => runOne()));
}

export function countReservationResults(results: ReservationAttemptResult[]) {
  const wins = results.filter((r) => r === "ok").length;
  return { wins, sold: results.length - wins };
}

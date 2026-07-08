"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { auth } from "@wse/core/auth";
import dbConnect from "@wse/core/lib/db";
import { generateFoxpostShipment } from "@wse/core/actions/foxpost-shipment";
import { isFoxpostParcelManagerEnabled } from "@wse/core/lib/parcel-feature-flags";
import { PluginService } from "@wse/core/services/plugin";
import { orderNeedsParcelLabel } from "@wse/core/lib/parcel-locker";

export type SandboxBulkLabelSkipReason =
  | "not_found"
  | "no_foxpost_apm"
  | "manager_disabled"
  | "connection_missing"
  | "label_exists";

async function checkAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
}

export async function bulkGenerateSandboxParcelLabels(
  orderIds: string[],
  options?: { skipExisting?: boolean }
) {
  await checkAdmin();
  await dbConnect();

  const pluginEnabled = await PluginService.isEnabled("order-lab");
  if (!pluginEnabled) {
    throw new Error("Az order-lab plugin nincs engedélyezve.");
  }

  const foxpostManagerEnabled = await isFoxpostParcelManagerEnabled();
  if (!foxpostManagerEnabled) {
    throw new Error("A Foxpost csomagkezelő ki van kapcsolva.");
  }

  const { OrderLabSettingsService } = await import(
    "@wse/plugin-order-lab/services/order-lab-settings-service"
  );
  try {
    await OrderLabSettingsService.getFoxpostConfig();
  } catch (error: unknown) {
    throw new Error(
      error instanceof Error
        ? error.message
        : "Foxpost sandbox kapcsolat nincs beállítva."
    );
  }

  const skipExisting = options?.skipExisting !== false;
  const uniqueOrderIds = Array.from(
    new Set(
      orderIds
        .map((orderId) => String(orderId || "").trim())
        .filter((orderId) => mongoose.Types.ObjectId.isValid(orderId))
    )
  );

  if (uniqueOrderIds.length === 0) {
    throw new Error("Nincs érvényes sandbox rendelés kijelölve.");
  }

  const { default: SandboxOrder } = await import("@wse/plugin-order-lab/models/SandboxOrder");
  const orders = await SandboxOrder.find({ _id: { $in: uniqueOrderIds } });
  const ordersById = new Map(orders.map((order) => [order._id.toString(), order]));

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const failures: { orderId: string; error: string }[] = [];
  const skips: { orderId: string; reason: SandboxBulkLabelSkipReason }[] = [];

  for (const orderId of uniqueOrderIds) {
    const order = ordersById.get(orderId);
    if (!order) {
      skippedCount += 1;
      skips.push({ orderId, reason: "not_found" });
      continue;
    }

    if (!order.foxpostParcelPoint?.id) {
      skippedCount += 1;
      skips.push({ orderId, reason: "no_foxpost_apm" });
      continue;
    }

    if (skipExisting && !orderNeedsParcelLabel(order)) {
      skippedCount += 1;
      skips.push({ orderId, reason: "label_exists" });
      continue;
    }

    const result = await generateFoxpostShipment({ source: "sandbox", id: orderId });
    if (result.success) {
      successCount += 1;
      revalidatePath(`/admin/plugins/order-lab/orders/${orderId}`);
    } else {
      failedCount += 1;
      failures.push({ orderId, error: result.error || "Ismeretlen hiba" });
    }
  }

  revalidatePath("/admin/plugins/order-lab/orders");
  revalidatePath("/admin/plugins/order-lab");

  return {
    success: true,
    successCount,
    skippedCount,
    failedCount,
    failures,
    skips,
    missingCount: uniqueOrderIds.length - orders.length,
  };
}

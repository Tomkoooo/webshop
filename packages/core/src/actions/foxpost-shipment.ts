"use server";

import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import { auth } from "@wse/core/auth";
import { FoxpostApiClient, type FoxpostConfig } from "@wse/core/services/foxpost";
import { isFoxpostParcelManagerEnabled } from "@wse/core/lib/parcel-feature-flags";
import { PluginService } from "@wse/core/services/plugin";
import type { FoxpostLabelInfo, FoxpostTrack, FoxpostUpdateParcelPatch } from "@wse/core/lib/foxpost";
import type { IOrder } from "@wse/core/models/Order";

export type FoxpostShipmentSource = "live" | "sandbox";

type ParcelActionResult = { success: true; data?: unknown } | { success: false; error: string };

type FoxpostOrderLike = {
  _id: mongoose.Types.ObjectId;
  foxpostParcelPoint?: IOrder["foxpostParcelPoint"];
  foxpostShipment?: IOrder["foxpostShipment"];
  shippingAddress: IOrder["shippingAddress"];
  save(): Promise<unknown>;
  set(path: string, value: unknown): unknown;
};

async function checkAdmin() {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session;
}

async function assertFoxpostManagerEnabled() {
  const enabled = await isFoxpostParcelManagerEnabled();
  if (!enabled) {
    throw new Error("A Foxpost csomagkezelő ki van kapcsolva.");
  }
}

async function loadFoxpostOrder(
  source: FoxpostShipmentSource,
  id: string
): Promise<FoxpostOrderLike> {
  await dbConnect();

  if (source === "live") {
    const order = await Order.findById(id);
    if (!order) throw new Error("Rendelés nem található.");
    if (!order.foxpostParcelPoint?.id) {
      throw new Error("Ehhez a rendeléshez nincs Foxpost csomagautomata mentve.");
    }
    return order as unknown as FoxpostOrderLike;
  }

  const pluginEnabled = await PluginService.isEnabled("order-lab");
  if (!pluginEnabled) {
    throw new Error("Az order-lab plugin nincs engedélyezve.");
  }

  const { default: SandboxOrder } = await import("@wse/plugin-order-lab/models/SandboxOrder");
  const order = await SandboxOrder.findById(id);
  if (!order) throw new Error("Sandbox rendelés nem található.");
  if (!order.foxpostParcelPoint?.id) {
    throw new Error("Ehhez a sandbox rendeléshez nincs Foxpost automata mentve.");
  }
  return order as unknown as FoxpostOrderLike;
}

function labelUrlFor(source: FoxpostShipmentSource, id: string): string {
  return source === "live"
    ? `/api/admin/orders/${id}/foxpost-label`
    : `/api/plugins/order-lab/orders/${id}/foxpost-label`;
}

function revalidateFoxpostOrder(source: FoxpostShipmentSource, id: string) {
  if (source === "live") {
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/orders");
    return;
  }
  revalidatePath(`/admin/plugins/order-lab/orders/${id}`);
  revalidatePath("/admin/plugins/order-lab/orders");
  revalidatePath("/admin/plugins/order-lab");
}

async function resolveFoxpostConfig(source: FoxpostShipmentSource): Promise<FoxpostConfig | undefined> {
  if (source === "live") return undefined;
  const { OrderLabSettingsService } = await import(
    "@wse/plugin-order-lab/services/order-lab-settings-service"
  );
  return OrderLabSettingsService.getFoxpostConfig();
}

async function applyFoxpostShipment(
  order: FoxpostOrderLike,
  source: FoxpostShipmentSource,
  generatedByUserId?: string
): Promise<ParcelActionResult> {
  const id = order._id.toString();
  let clFoxId = order.foxpostShipment?.clFoxId;
  let refCode = order.foxpostShipment?.refCode;
  const foxpostConfig = await resolveFoxpostConfig(source);

  if (order.foxpostShipment?.lastError) {
    order.foxpostShipment = {
      ...(order.foxpostShipment || {}),
      lastError: undefined,
    };
    await order.save();
    if (source === "live") {
      await Order.updateOne({ _id: order._id }, { $unset: { "foxpostShipment.lastError": "" } });
    } else {
      const { default: SandboxOrder } = await import("@wse/plugin-order-lab/models/SandboxOrder");
      await SandboxOrder.updateOne({ _id: order._id }, { $unset: { "foxpostShipment.lastError": "" } });
    }
    revalidateFoxpostOrder(source, id);
  }

  try {
    if (!clFoxId) {
      const created = await FoxpostApiClient.createParcelForOrder(
        order as unknown as IOrder,
        foxpostConfig
      );
      clFoxId = created.clFoxId || created.barcode;
      refCode = created.refCode || order._id.toString().slice(-30);
      if (!clFoxId) {
        throw new Error("Foxpost csomag azonosító hiányzik a létrehozás után.");
      }
      order.foxpostShipment = {
        ...(order.foxpostShipment || {}),
        clFoxId,
        refCode,
        lastError: undefined,
      };
      await order.save();
    }

    const result = await FoxpostApiClient.createShipmentForOrder(
      order as unknown as IOrder,
      foxpostConfig
    );
    order.foxpostShipment = {
      ...(order.foxpostShipment || {}),
      clFoxId: result.clFoxId,
      refCode: result.refCode || refCode,
      labelDataBase64: result.labelDataBase64,
      labelPageSize: result.labelPageSize,
      trackingStatus: result.trackingStatus,
      labelUrl: labelUrlFor(source, id),
      generatedAt: new Date(),
      generatedBy: generatedByUserId
        ? new mongoose.Types.ObjectId(generatedByUserId)
        : order.foxpostShipment?.generatedBy,
      lastError: undefined,
    };
    order.set("foxpostShipment.lastError", undefined);
    await order.save();

    if (source === "live") {
      await Order.updateOne({ _id: order._id }, { $unset: { "foxpostShipment.lastError": "" } });
    } else {
      const { default: SandboxOrder } = await import("@wse/plugin-order-lab/models/SandboxOrder");
      await SandboxOrder.updateOne({ _id: order._id }, { $unset: { "foxpostShipment.lastError": "" } });
    }

    revalidateFoxpostOrder(source, id);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "A Foxpost csomag/címke létrehozása sikertelen.";
    order.foxpostShipment = {
      ...(order.foxpostShipment || {}),
      clFoxId: clFoxId || order.foxpostShipment?.clFoxId,
      refCode: refCode || order.foxpostShipment?.refCode,
      lastError: message,
    };
    await order.save();
    revalidateFoxpostOrder(source, id);
    return { success: false, error: message };
  }
}

export async function generateFoxpostShipment(input: {
  source: FoxpostShipmentSource;
  id: string;
}): Promise<ParcelActionResult> {
  const session = await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  return applyFoxpostShipment(order, input.source, session.user?.id);
}

export async function clearFoxpostShipmentError(input: {
  source: FoxpostShipmentSource;
  id: string;
}): Promise<ParcelActionResult> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  if (!order.foxpostShipment?.lastError) {
    return { success: true };
  }

  order.foxpostShipment = {
    ...(order.foxpostShipment || {}),
    lastError: undefined,
  };
  await order.save();

  if (input.source === "live") {
    await Order.updateOne({ _id: order._id }, { $unset: { "foxpostShipment.lastError": "" } });
  } else {
    const { default: SandboxOrder } = await import("@wse/plugin-order-lab/models/SandboxOrder");
    await SandboxOrder.updateOne({ _id: order._id }, { $unset: { "foxpostShipment.lastError": "" } });
  }

  revalidateFoxpostOrder(input.source, input.id);
  return { success: true };
}

export async function generateOrderFoxpostShipment(orderId: string): Promise<ParcelActionResult> {
  return generateFoxpostShipment({ source: "live", id: orderId });
}

export async function refreshFoxpostTracking(input: {
  source: FoxpostShipmentSource;
  id: string;
}): Promise<ParcelActionResult & { data?: { trackingStatus?: string; tracks?: FoxpostTrack[] } }> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  const clFoxId = order.foxpostShipment?.clFoxId;
  if (!clFoxId) {
    return { success: false, error: "Nincs Foxpost csomag azonosító." };
  }

  try {
    const foxpostConfig = await resolveFoxpostConfig(input.source);
    const [detail, tracks] = await Promise.all([
      FoxpostApiClient.getTrackingDetail(clFoxId, foxpostConfig),
      FoxpostApiClient.getTrackingHistory(clFoxId, foxpostConfig),
    ]);
    const lastTrace = detail.traces?.[detail.traces.length - 1];
    const trackingStatus = lastTrace?.status || lastTrace?.shortName;

    order.foxpostShipment = {
      ...(order.foxpostShipment || {}),
      trackingStatus,
      lastError: undefined,
    };
    await order.save();
    revalidateFoxpostOrder(input.source, input.id);

    return { success: true, data: { trackingStatus, tracks } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Tracking frissítés sikertelen.";
    return { success: false, error: message };
  }
}

export async function updateFoxpostParcel(input: {
  source: FoxpostShipmentSource;
  id: string;
  patch: FoxpostUpdateParcelPatch;
}): Promise<ParcelActionResult> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  const clFoxId = order.foxpostShipment?.clFoxId;
  if (!clFoxId) {
    return { success: false, error: "Nincs Foxpost csomag azonosító a frissítéshez." };
  }

  try {
    const foxpostConfig = await resolveFoxpostConfig(input.source);
    await FoxpostApiClient.updateParcel(clFoxId, input.patch, foxpostConfig);

    if (input.patch.recipientName) order.shippingAddress.name = input.patch.recipientName;
    if (input.patch.recipientPhone) order.shippingAddress.phone = input.patch.recipientPhone;
    if (input.patch.recipientEmail) order.shippingAddress.email = input.patch.recipientEmail;

    order.foxpostShipment = {
      ...(order.foxpostShipment || {}),
      lastError: undefined,
    };
    await order.save();
    revalidateFoxpostOrder(input.source, input.id);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Foxpost csomag frissítés sikertelen.";
    return { success: false, error: message };
  }
}

export async function deleteFoxpostParcel(input: {
  source: FoxpostShipmentSource;
  id: string;
}): Promise<ParcelActionResult> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  const clFoxId = order.foxpostShipment?.clFoxId;
  if (!clFoxId) {
    return { success: false, error: "Nincs Foxpost csomag azonosító a törléshez." };
  }

  try {
    const foxpostConfig = await resolveFoxpostConfig(input.source);
    await FoxpostApiClient.deleteParcel(clFoxId, foxpostConfig);
    order.foxpostShipment = {
      labelPageSize: order.foxpostShipment?.labelPageSize,
      lastError: undefined,
    };
    await order.save();

    if (input.source === "live") {
      await Order.updateOne(
        { _id: order._id },
        {
          $unset: {
            "foxpostShipment.clFoxId": "",
            "foxpostShipment.refCode": "",
            "foxpostShipment.labelUrl": "",
            "foxpostShipment.labelDataBase64": "",
            "foxpostShipment.trackingStatus": "",
            "foxpostShipment.generatedAt": "",
            "foxpostShipment.generatedBy": "",
            "foxpostShipment.returnBarcode": "",
          },
        }
      );
    } else {
      const { default: SandboxOrder } = await import("@wse/plugin-order-lab/models/SandboxOrder");
      await SandboxOrder.updateOne(
        { _id: order._id },
        {
          $unset: {
            "foxpostShipment.clFoxId": "",
            "foxpostShipment.refCode": "",
            "foxpostShipment.labelUrl": "",
            "foxpostShipment.labelDataBase64": "",
            "foxpostShipment.trackingStatus": "",
            "foxpostShipment.generatedAt": "",
            "foxpostShipment.generatedBy": "",
            "foxpostShipment.returnBarcode": "",
          },
        }
      );
    }

    revalidateFoxpostOrder(input.source, input.id);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Foxpost csomag törlés sikertelen.";
    return { success: false, error: message };
  }
}

export async function createFoxpostReturn(input: {
  source: FoxpostShipmentSource;
  id: string;
}): Promise<ParcelActionResult & { data?: { returnBarcode?: string } }> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  const clFoxId = order.foxpostShipment?.clFoxId;
  if (!clFoxId) {
    return { success: false, error: "Nincs Foxpost csomag azonosító a visszaküldéshez." };
  }

  try {
    const foxpostConfig = await resolveFoxpostConfig(input.source);
    const result = await FoxpostApiClient.createReturnParcel(
      clFoxId,
      order.foxpostShipment?.refCode,
      foxpostConfig
    );
    order.foxpostShipment = {
      ...(order.foxpostShipment || {}),
      returnBarcode: result.newBarcode,
      lastError: undefined,
    };
    await order.save();
    revalidateFoxpostOrder(input.source, input.id);
    return { success: true, data: { returnBarcode: result.newBarcode } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Foxpost visszaküldés sikertelen.";
    return { success: false, error: message };
  }
}

export async function fetchFoxpostLabelInfo(input: {
  source: FoxpostShipmentSource;
  id: string;
}): Promise<ParcelActionResult & { data?: FoxpostLabelInfo }> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  const clFoxId = order.foxpostShipment?.clFoxId;
  if (!clFoxId) {
    return { success: false, error: "Nincs Foxpost csomag azonosító." };
  }

  try {
    const foxpostConfig = await resolveFoxpostConfig(input.source);
    const data = await FoxpostApiClient.getLabelInfo(clFoxId, foxpostConfig);
    return { success: true, data };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Foxpost címke info lekérés sikertelen.";
    return { success: false, error: message };
  }
}

export async function downloadFoxpostDeliveryNote(input: {
  source: FoxpostShipmentSource;
  id: string;
}): Promise<ParcelActionResult & { data?: { pdfBase64: string } }> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();
  const order = await loadFoxpostOrder(input.source, input.id);
  const clFoxId = order.foxpostShipment?.clFoxId;
  if (!clFoxId) {
    return { success: false, error: "Nincs Foxpost csomag azonosító." };
  }

  try {
    const foxpostConfig = await resolveFoxpostConfig(input.source);
    const pdfBase64 = await FoxpostApiClient.fetchDeliveryNotePdf(
      [clFoxId],
      order.shippingAddress.name,
      foxpostConfig
    );
    return { success: true, data: { pdfBase64 } };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Foxpost fuvarlevél letöltés sikertelen.";
    return { success: false, error: message };
  }
}

export async function getFoxpostConnectionStatusAction() {
  await checkAdmin();
  const { getFoxpostConnectionStatus } = await import("@wse/core/services/foxpost");
  return getFoxpostConnectionStatus();
}

export async function updateFoxpostParcelPointOnOrder(input: {
  source: FoxpostShipmentSource;
  id: string;
  apmId: string;
}): Promise<ParcelActionResult> {
  await checkAdmin();
  await assertFoxpostManagerEnabled();

  const apmId = input.apmId.trim();
  if (!apmId) {
    return { success: false, error: "Válassz Foxpost csomagautomatát." };
  }

  const order = await loadFoxpostOrder(input.source, input.id);
  if (order.foxpostShipment?.clFoxId) {
    return {
      success: false,
      error: "A csomagpont csak akkor módosítható, ha még nincs Foxpost csomag létrehozva. Előbb töröld a csomagot.",
    };
  }

  const { findFoxpostApmById, resolveFoxpostApmCatalogMode } = await import("@wse/core/lib/foxpost-apm-catalog");
  const catalogMode =
    input.source === "sandbox" ? ("sandbox" as const) : await resolveFoxpostApmCatalogMode();
  const point = await findFoxpostApmById(apmId, {
    mode: catalogMode,
    forceRefresh: true,
  });
  if (!point) {
    return {
      success: false,
      error: "Az automata nem található a friss Foxpost listában. Válassz másik pontot.",
    };
  }

  order.foxpostParcelPoint = {
    id: point.id,
    name: point.name,
    address: point.address,
    zip: point.zip,
    city: point.city,
    findme: point.findme,
    load: point.load,
  };

  if (order.foxpostShipment?.lastError) {
    order.foxpostShipment = {
      ...(order.foxpostShipment || {}),
      lastError: undefined,
    };
  }

  await order.save();

  if (input.source === "live") {
    await Order.updateOne(
      { _id: order._id },
      { $unset: { "foxpostShipment.lastError": "" } }
    );
  } else {
    const { default: SandboxOrder } = await import("@wse/plugin-order-lab/models/SandboxOrder");
    await SandboxOrder.updateOne({ _id: order._id }, { $unset: { "foxpostShipment.lastError": "" } });
  }

  revalidateFoxpostOrder(input.source, input.id);
  return { success: true, data: { foxpostParcelPoint: point } };
}

export async function testFoxpostConnectionAction() {
  await checkAdmin();
  try {
    await FoxpostApiClient.testConnection();
    return { success: true as const };
  } catch (error: unknown) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Kapcsolat teszt sikertelen.",
    };
  }
}

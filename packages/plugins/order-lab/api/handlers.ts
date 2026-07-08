import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { format } from "date-fns";
import type { PluginApiContext } from "@wse/sdk/plugins/types";
import { FoxpostApiClient } from "@wse/core/services/foxpost";
import { listSandboxApms } from "@wse/core/lib/foxpost-sandbox-apms";
import { listFoxpostApms } from "@wse/core/lib/foxpost-apm-catalog";
import { PluginService } from "@wse/core/services/plugin";
import { OrderLabSettingsService } from "../services/order-lab-settings-service";
import {
  clearSandboxOrders,
  countSandboxOrders,
  getSandboxOrderById,
  listSandboxOrders,
  seedSandboxOrders,
} from "../services/seed-sandbox-orders";
import { buildSandboxOrdersExcelBuffer } from "../lib/sandbox-orders-export";
import { buildSandboxOrderLabelsZipBuffer } from "../lib/sandbox-orders-labels-zip";

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

function parseSandboxOrderIds(searchParams: URLSearchParams): string[] {
  const raw = searchParams.get("ids");
  if (!raw) return [];

  return Array.from(
    new Set(
      raw
        .split(",")
        .map((id) => id.trim())
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
    )
  );
}

async function assertOrderLabEnabled() {
  const enabled = await PluginService.isEnabled("order-lab");
  if (!enabled) {
    throw new Error("Az order-lab plugin nincs engedélyezve.");
  }
}

export async function handleOrderLabApi(context: PluginApiContext): Promise<Response> {
  const { path, request } = context;
  const method = request.method.toUpperCase();
  const segment = path[0] ?? "";

  try {
    const { requireAdmin } = await import("@wse/core/lib/admin-auth");
    const session = await requireAdmin();

    if (segment === "connection-test" && method === "GET") {
      try {
        const config = await OrderLabSettingsService.getFoxpostConfig();
        await FoxpostApiClient.testConnection(config);
        const status = await OrderLabSettingsService.getFoxpostConnectionStatus();
        return json({ ok: true, connection: { ...status, isConfigured: true, source: "admin" } });
      } catch (error: unknown) {
        const status = await OrderLabSettingsService.getFoxpostConnectionStatus();
        return json(
          {
            ok: false,
            connection: {
              ...status,
              isConfigured: Boolean(status.hasPassword && status.hasApiKey && status.username),
              source: "admin",
            },
            error: error instanceof Error ? error.message : "Kapcsolat teszt sikertelen.",
          },
          502
        );
      }
    }

    if (segment === "connection" && method === "GET") {
      const connection = await OrderLabSettingsService.getFoxpostConnection();
      const status = await OrderLabSettingsService.getFoxpostConnectionStatus();
      return json({
        connection: {
          ...connection,
          usernameMasked: status.usernameMasked,
          source: "admin",
        },
      });
    }

    if (segment === "connection" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const connection = await OrderLabSettingsService.saveFoxpostConnection({
        apiBaseUrl: typeof body.apiBaseUrl === "string" ? body.apiBaseUrl : "",
        username: typeof body.username === "string" ? body.username : "",
        password: typeof body.password === "string" ? body.password : undefined,
        apiKey: typeof body.apiKey === "string" ? body.apiKey : undefined,
        isWeb: typeof body.isWeb === "boolean" ? body.isWeb : undefined,
        parcelSize: typeof body.parcelSize === "string" ? body.parcelSize : undefined,
        labelPageSize: typeof body.labelPageSize === "string" ? body.labelPageSize : undefined,
        defaultSeedCount:
          typeof body.defaultSeedCount === "number"
            ? body.defaultSeedCount
            : Number(body.defaultSeedCount) || undefined,
        defaultApmId: typeof body.defaultApmId === "string" ? body.defaultApmId : undefined,
      });
      const status = await OrderLabSettingsService.getFoxpostConnectionStatus();
      return json({
        connection: {
          ...connection,
          usernameMasked: status.usernameMasked,
          source: "admin",
        },
      });
    }

    if (segment === "apms" && method === "GET") {
      const forceRefresh = new URL(request.url).searchParams.get("refresh") === "1";
      const snapshot = await listFoxpostApms({ mode: "sandbox", forceRefresh });
      return json({ apms: snapshot.apms, fetchedAt: snapshot.fetchedAt, mode: snapshot.mode });
    }

    if (segment === "stats" && method === "GET") {
      const count = await countSandboxOrders();
      return json({ sandboxOrderCount: count });
    }

    if (segment === "seed" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const count = typeof body.count === "number" ? body.count : Number(body.count) || 3;
      const apmId = typeof body.apmId === "string" ? body.apmId : undefined;
      const result = await seedSandboxOrders({
        count,
        apmId,
        seededByUserId: session.user?.id,
      });
      return json(result, 201);
    }

    if (segment === "clear" && method === "POST") {
      const result = await clearSandboxOrders();
      return json(result);
    }

    if (segment === "export" && method === "GET") {
      await assertOrderLabEnabled();
      const orders = await listSandboxOrders(500);
      const buffer = await buildSandboxOrdersExcelBuffer(
        orders.map((order) => ({
          ...order,
          _id: order._id.toString(),
          foxpostShipment: order.foxpostShipment
            ? {
                ...order.foxpostShipment,
                labelUrl:
                  order.foxpostShipment.labelUrl ||
                  (order.foxpostShipment.labelDataBase64
                    ? `/api/plugins/order-lab/orders/${order._id.toString()}/foxpost-label`
                    : undefined),
              }
            : undefined,
        }))
      );
      const filename = `sandbox-rendelesek-${format(new Date(), "yyyy-MM-dd-HHmm")}.xlsx`;
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(buffer.byteLength),
          "Cache-Control": "no-store",
        },
      });
    }

    if (segment === "export-labels" && method === "GET") {
      await assertOrderLabEnabled();
      const selectedIds = parseSandboxOrderIds(new URL(request.url).searchParams);
      const { default: SandboxOrder } = await import("../models/SandboxOrder");
      await (await import("@wse/core/lib/db")).default();

      const orders =
        selectedIds.length > 0
          ? await SandboxOrder.find({ _id: { $in: selectedIds } })
              .select("orderNumber foxpostShipment")
              .sort({ createdAt: -1 })
              .lean()
          : await SandboxOrder.find()
              .select("orderNumber foxpostShipment")
              .sort({ createdAt: -1 })
              .limit(500)
              .lean();

      const buffer = await buildSandboxOrderLabelsZipBuffer(
        orders.map((order) => ({
          orderNumber: order.orderNumber,
          foxpostShipment: order.foxpostShipment,
        }))
      );

      if (!buffer) {
        return json(
          { error: "Nincs letölthető címke a kijelölt sandbox rendelésekhez." },
          404
        );
      }

      const filename = `sandbox-cimkek-${format(new Date(), "yyyy-MM-dd-HHmm")}.zip`;
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": String(buffer.byteLength),
          "Cache-Control": "no-store",
        },
      });
    }

    if (segment === "orders-list" && method === "GET") {
      const orderId = path[1];
      if (orderId) {
        const order = await getSandboxOrderById(orderId);
        if (!order) return json({ error: "Not found" }, 404);
        const { isFoxpostParcelManagerEnabled } = await import("@wse/core/lib/parcel-feature-flags");
        return json({
          order: {
            ...order,
            _id: order._id.toString(),
          },
          foxpostManagerEnabled: await isFoxpostParcelManagerEnabled(),
        });
      }

      const { isFoxpostParcelManagerEnabled } = await import("@wse/core/lib/parcel-feature-flags");
      const orders = await listSandboxOrders();
      return json({
        foxpostManagerEnabled: await isFoxpostParcelManagerEnabled(),
        orders: orders.map((order) => ({
          _id: order._id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          createdAt: order.createdAt,
          total: order.total,
          shippingAddress: order.shippingAddress
            ? { name: order.shippingAddress.name }
            : undefined,
          items: Array.isArray(order.items) ? order.items : [],
          foxpostParcelPoint: order.foxpostParcelPoint,
          foxpostShipment: order.foxpostShipment
            ? {
                clFoxId: order.foxpostShipment.clFoxId,
                trackingStatus: order.foxpostShipment.trackingStatus,
                labelUrl: order.foxpostShipment.labelUrl,
                labelDataBase64: order.foxpostShipment.labelDataBase64
                  ? "present"
                  : undefined,
              }
            : undefined,
        })),
      });
    }

    if (segment === "orders" && path[1] && path[2] === "foxpost-label" && method === "GET") {
      const orderId = path[1];
      const order = await getSandboxOrderById(orderId);
      if (!order?.foxpostShipment?.labelDataBase64) {
        return json({ error: "Foxpost címke nem található." }, 404);
      }
      const pdfBuffer = Buffer.from(order.foxpostShipment.labelDataBase64, "base64");
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="foxpost-label-${order.orderNumber}.pdf"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return json({ error: "Unauthorized" }, 401);
    }
    return json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      500
    );
  }
}

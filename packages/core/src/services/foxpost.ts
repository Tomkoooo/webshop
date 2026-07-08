import { IOrder } from "@wse/core/models/Order";
import { normalizeHuMobilePhone } from "@wse/core/lib/parcel-locker";
import type {
  FoxpostConnectionStatus,
  FoxpostLabelInfo,
  FoxpostReturnAddress,
  FoxpostTrack,
  FoxpostTrackingDetail,
  FoxpostUpdateParcelPatch,
} from "@wse/core/lib/foxpost";

export type FoxpostConfig = {
  apiBaseUrl: string;
  username: string;
  password: string;
  apiKey: string;
  parcelSize: string;
  labelPageSize: string;
  isWeb: boolean;
  isSandbox: boolean;
};

export type FoxpostParcelResponseItem = {
  clFoxId?: string;
  barcode?: string;
  refCode?: string;
  destination?: string;
  valid?: boolean;
  errors?: Array<{ field?: string; message?: string }>;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing ${name}`);
  }
  return value.trim();
}

export function buildFoxpostConfigFromFields(fields: {
  apiBaseUrl: string;
  username: string;
  password: string;
  apiKey: string;
  parcelSize?: string;
  labelPageSize?: string;
  isWeb?: boolean;
}): FoxpostConfig {
  const base = fields.apiBaseUrl.replace(/\/+$/, "");
  const isSandbox = base.includes("webapi-test");
  return {
    apiBaseUrl: base,
    username: fields.username.trim(),
    password: fields.password,
    apiKey: fields.apiKey.trim(),
    parcelSize: (fields.parcelSize || "M").trim(),
    labelPageSize: (fields.labelPageSize || "A6").trim(),
    isWeb: fields.isWeb !== undefined ? fields.isWeb : !isSandbox,
    isSandbox,
  };
}

export function getFoxpostConnectionStatusFromConfig(config: FoxpostConfig): FoxpostConnectionStatus {
  const username = config.username;
  const masked =
    username.length <= 2
      ? "*".repeat(username.length)
      : `${username.slice(0, 2)}${"*".repeat(Math.max(username.length - 2, 3))}`;
  return {
    apiBaseUrl: config.apiBaseUrl,
    isSandbox: config.isSandbox,
    isWeb: config.isWeb,
    username,
    usernameMasked: masked,
    hasPassword: Boolean(config.password?.trim()),
    hasApiKey: Boolean(config.apiKey?.trim()),
    parcelSize: config.parcelSize,
    labelPageSize: config.labelPageSize,
  };
}

export function getFoxpostConfig(): FoxpostConfig {
  const base = (process.env.FOXPOST_API_BASE_URL || "https://webapi-test.foxpost.hu/api").replace(
    /\/+$/,
    ""
  );
  const isSandbox = base.includes("webapi-test");
  return {
    apiBaseUrl: base,
    username: requireEnv("FOXPOST_API_USERNAME"),
    password: requireEnv("FOXPOST_API_PASSWORD"),
    apiKey: requireEnv("FOXPOST_API_KEY"),
    parcelSize: (process.env.FOXPOST_PARCEL_SIZE || "M").trim(),
    labelPageSize: (process.env.FOXPOST_LABEL_PAGE_SIZE || "A6").trim(),
    isWeb: process.env.FOXPOST_IS_WEB === "true" ? true : !isSandbox,
    isSandbox,
  };
}

export function getFoxpostConnectionStatus(): FoxpostConnectionStatus {
  return getFoxpostConnectionStatusFromConfig(getFoxpostConfig());
}

function authHeaders(config: FoxpostConfig, acceptPdf = false): HeadersInit {
  const token = Buffer.from(`${config.username}:${config.password}`, "utf8").toString("base64");
  return {
    Authorization: `Basic ${token}`,
    "Api-key": config.apiKey,
    "Content-Type": "application/json",
    ...(acceptPdf ? { Accept: "application/pdf" } : {}),
  };
}

function parseParcelResponseItems(data: unknown): FoxpostParcelResponseItem[] {
  if (Array.isArray(data)) return data as FoxpostParcelResponseItem[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.parcels)) return obj.parcels as FoxpostParcelResponseItem[];
    if (Array.isArray(obj.data)) return obj.data as FoxpostParcelResponseItem[];
    return [obj as FoxpostParcelResponseItem];
  }
  return [];
}

function extractParcelError(item: FoxpostParcelResponseItem): string | null {
  if (item.errors && item.errors.length > 0) {
    const first = item.errors[0];
    return first?.message || first?.field || "Foxpost csomag létrehozási hiba.";
  }
  if (item.valid === false) {
    return "Foxpost csomag létrehozása sikertelen.";
  }
  return null;
}

async function foxpostFetch(
  config: FoxpostConfig,
  path: string,
  init: RequestInit & { acceptPdf?: boolean } = {}
): Promise<Response> {
  const { acceptPdf, ...fetchInit } = init;
  const url = path.startsWith("http") ? path : `${config.apiBaseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const response = await fetch(url, {
    ...fetchInit,
    headers: {
      ...authHeaders(config, acceptPdf),
      ...(fetchInit.headers || {}),
    },
  });
  return response;
}

async function throwFoxpostError(response: Response, prefix: string): Promise<never> {
  const text = await response.text().catch(() => "");
  throw new Error(`${prefix} (${response.status})${text ? `: ${text.slice(0, 200)}` : ""}`);
}

export class FoxpostApiClient {
  static getConfig(configOverride?: FoxpostConfig): FoxpostConfig {
    return configOverride ?? getFoxpostConfig();
  }

  static async testConnection(configOverride?: FoxpostConfig): Promise<{ ok: true }> {
    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(config, "/address", { method: "GET" });
    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost kapcsolat teszt sikertelen");
    }
    return { ok: true };
  }

  static async createParcelForOrder(
    order: IOrder,
    configOverride?: FoxpostConfig
  ): Promise<FoxpostParcelResponseItem> {
    if (!order.foxpostParcelPoint?.id) {
      throw new Error("A rendeléshez nincs Foxpost csomagautomata mentve.");
    }

    const config = this.getConfig(configOverride);
    const phone = normalizeHuMobilePhone(order.shippingAddress.phone);
    const refCode = order._id.toString().slice(-30);

    const payload = [
      {
        destination: order.foxpostParcelPoint.id,
        recipientName: order.shippingAddress.name,
        recipientPhone: phone,
        recipientEmail: order.shippingAddress.email,
        size: config.parcelSize,
        refCode,
        cod: 0,
      },
    ];

    const url = `/parcel?isWeb=${config.isWeb ? "true" : "false"}`;
    const response = await foxpostFetch(config, url, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost API hiba");
    }

    const data = await response.json();
    const items = parseParcelResponseItems(data);
    const first = items[0];
    if (!first) {
      throw new Error("A Foxpost válasz nem tartalmaz csomag adatot.");
    }

    const err = extractParcelError(first);
    if (err) throw new Error(err);

    const clFoxId = first.clFoxId || first.barcode;
    if (!clFoxId) {
      throw new Error("A Foxpost válasz nem tartalmaz csomag azonosítót (clFoxId).");
    }

    return { ...first, clFoxId, refCode: first.refCode || refCode };
  }

  static async fetchLabelPdf(
    clFoxIds: string[],
    pageSize?: string,
    configOverride?: FoxpostConfig
  ): Promise<string> {
    if (clFoxIds.length === 0) {
      throw new Error("Nincs Foxpost csomag azonosító a címke generáláshoz.");
    }

    const config = this.getConfig(configOverride);
    const size = (pageSize || config.labelPageSize).trim();
    const response = await foxpostFetch(config, `/label/${encodeURIComponent(size)}`, {
      method: "POST",
      acceptPdf: true,
      body: JSON.stringify(clFoxIds),
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost címke API hiba");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new Error("A Foxpost válasz nem tartalmaz nyomtatható címkét.");
    }
    return buffer.toString("base64");
  }

  static async fetchDeliveryNotePdf(
    clFoxIds: string[],
    senderName?: string,
    configOverride?: FoxpostConfig
  ): Promise<string> {
    if (clFoxIds.length === 0) {
      throw new Error("Nincs Foxpost csomag azonosító a fuvarlevél generáláshoz.");
    }

    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(config, "/label/deliveryNote", {
      method: "POST",
      acceptPdf: true,
      body: JSON.stringify({
        sender: senderName || config.username,
        clFoxCodes: clFoxIds,
      }),
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost fuvarlevél API hiba");
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0) {
      throw new Error("A Foxpost válasz nem tartalmaz fuvarlevelet.");
    }
    return buffer.toString("base64");
  }

  static async createShipmentForOrder(
    order: IOrder,
    configOverride?: FoxpostConfig
  ): Promise<{
    clFoxId: string;
    refCode?: string;
    labelDataBase64: string;
    labelPageSize: string;
    trackingStatus?: string;
  }> {
    const config = this.getConfig(configOverride);
    let clFoxId = order.foxpostShipment?.clFoxId;

    if (!clFoxId) {
      const created = await this.createParcelForOrder(order, config);
      clFoxId = created.clFoxId || created.barcode;
      if (!clFoxId) {
        throw new Error("Foxpost csomag azonosító hiányzik a létrehozás után.");
      }
    }

    const labelDataBase64 = await this.fetchLabelPdf([clFoxId], config.labelPageSize, config);
    let trackingStatus: string | undefined;
    try {
      trackingStatus = await this.getTrackingStatus(clFoxId, config);
    } catch {
      trackingStatus = undefined;
    }

    return {
      clFoxId,
      refCode: order.foxpostShipment?.refCode,
      labelDataBase64,
      labelPageSize: config.labelPageSize,
      trackingStatus,
    };
  }

  static async getTrackingStatus(
    barcode: string,
    configOverride?: FoxpostConfig
  ): Promise<string | undefined> {
    const detail = await this.getTrackingDetail(barcode, configOverride);
    const lastTrace = detail.traces?.[detail.traces.length - 1];
    return lastTrace?.status || lastTrace?.shortName || undefined;
  }

  static async getTrackingDetail(
    barcode: string,
    configOverride?: FoxpostConfig
  ): Promise<FoxpostTrackingDetail> {
    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(config, `/tracking/${encodeURIComponent(barcode)}`, {
      method: "GET",
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost tracking API hiba");
    }

    return (await response.json()) as FoxpostTrackingDetail;
  }

  static async getTrackingHistory(
    barcode: string,
    configOverride?: FoxpostConfig
  ): Promise<FoxpostTrack[]> {
    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(
      config,
      `/tracking/tracks/${encodeURIComponent(barcode)}`,
      { method: "GET" }
    );

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost tracking history API hiba");
    }

    const data = await response.json();
    return Array.isArray(data) ? (data as FoxpostTrack[]) : [];
  }

  static async getBatchTracking(
    barcodes: string[],
    configOverride?: FoxpostConfig
  ): Promise<Array<{ barcode: string; statuses: FoxpostTrack[] }>> {
    if (barcodes.length === 0) return [];

    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(config, "/tracking/tracks", {
      method: "POST",
      body: JSON.stringify(barcodes),
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost batch tracking API hiba");
    }

    const data = (await response.json()) as Array<{
      barcode?: string;
      statuses?: FoxpostTrack[];
    }>;
    return Array.isArray(data)
      ? data.map((item) => ({
          barcode: item.barcode || "",
          statuses: item.statuses || [],
        }))
      : [];
  }

  static async getLabelInfo(
    barcode: string,
    configOverride?: FoxpostConfig
  ): Promise<FoxpostLabelInfo> {
    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(config, `/label/info/${encodeURIComponent(barcode)}`, {
      method: "GET",
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost label info API hiba");
    }

    return (await response.json()) as FoxpostLabelInfo;
  }

  static async updateParcel(
    barcode: string,
    patch: FoxpostUpdateParcelPatch,
    configOverride?: FoxpostConfig
  ): Promise<FoxpostParcelResponseItem> {
    const config = this.getConfig(configOverride);
    const payload = [{ barcode, ...patch }];
    const response = await foxpostFetch(config, `/parcel?isWeb=${config.isWeb ? "true" : "false"}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost csomag frissítési hiba");
    }

    const data = await response.json();
    const items = parseParcelResponseItems(data);
    const first = items[0];
    if (!first) {
      throw new Error("A Foxpost válasz nem tartalmaz csomag adatot.");
    }

    const err = extractParcelError(first);
    if (err) throw new Error(err);

    return first;
  }

  static async deleteParcel(barcode: string, configOverride?: FoxpostConfig): Promise<void> {
    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(
      config,
      `/parcel/${encodeURIComponent(barcode)}?isWeb=${config.isWeb ? "true" : "false"}`,
      { method: "DELETE" }
    );

    if (!response.ok && response.status !== 204) {
      await throwFoxpostError(response, "Foxpost csomag törlési hiba");
    }
  }

  static async createReturnParcel(
    barcode: string,
    refCode?: string,
    configOverride?: FoxpostConfig
  ): Promise<{
    newBarcode?: string;
    barcode: string;
  }> {
    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(config, "/re/ext?returnType=RE", {
      method: "POST",
      body: JSON.stringify({ barcode, refCode }),
    });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost visszaküldési csomag hiba");
    }

    const data = (await response.json()) as {
      parcels?: Array<{ barcode?: string; newBarcode?: string }>;
      barcode?: string;
      newBarcode?: string;
    };

    const parcel = data.parcels?.[0];
    return {
      barcode,
      newBarcode: parcel?.newBarcode || parcel?.barcode || data.newBarcode || data.barcode,
    };
  }

  static async listReturnAddresses(configOverride?: FoxpostConfig): Promise<FoxpostReturnAddress[]> {
    const config = this.getConfig(configOverride);
    const response = await foxpostFetch(config, "/address", { method: "GET" });

    if (!response.ok) {
      await throwFoxpostError(response, "Foxpost cím lista hiba");
    }

    const data = await response.json();
    if (Array.isArray(data)) return data as FoxpostReturnAddress[];
    if (data && typeof data === "object" && Array.isArray((data as { addresses?: unknown }).addresses)) {
      return (data as { addresses: FoxpostReturnAddress[] }).addresses;
    }
    return data ? [data as FoxpostReturnAddress] : [];
  }
}

/** @deprecated Use FoxpostApiClient — kept for existing imports. */
export class FoxpostService extends FoxpostApiClient {}

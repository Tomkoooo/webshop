import crypto from "crypto";
import { IOrder } from "@wse/core/models/Order";

type GlsAddress = {
  Name: string;
  Street: string;
  HouseNumber: string;
  HouseNumberInfo?: string;
  City: string;
  ZipCode: string;
  CountryIsoCode: string;
  ContactName?: string;
  ContactPhone?: string;
  ContactEmail?: string;
};

type GlsPrintResult = {
  parcelId?: number;
  parcelNumber?: string;
  parcelNumberWithCheckdigit?: string;
  pin?: string;
  labelDataBase64: string;
};

type GlsErrorInfo = {
  ErrorCode?: number;
  ErrorDescription?: string;
};

type GlsPrintLabelsResponse = {
  Labels?: unknown;
  PrintLabelsErrorList?: GlsErrorInfo[];
  PrintLabelsInfoList?: Array<{ ParcelId?: number; ParcelNumber?: number | string; PIN?: string }>;
  PrintDataInfoList?: Array<{ ParcelNumberWithCheckdigit?: number | string; PIN?: string }>;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing ${name}`);
  }
  return value.trim();
}

function splitStreetAndHouseNumber(rawStreet: string) {
  const normalized = rawStreet.trim();
  const match = normalized.match(/^(.*?)(\d+[A-Za-z]?)\s*(.*)$/);
  if (!match) {
    return { street: normalized, houseNumber: "1", houseNumberInfo: undefined as string | undefined };
  }
  return {
    street: match[1].trim() || normalized,
    houseNumber: match[2].replace(/[^\d]/g, "") || "1",
    houseNumberInfo: match[3].trim() || undefined,
  };
}

function passwordToByteArray(password: string): number[] {
  return Array.from(crypto.createHash("sha512").update(password, "utf8").digest());
}

function normalizeLabels(labels: unknown): string {
  if (typeof labels === "string" && labels.length > 0) {
    return labels;
  }
  if (Array.isArray(labels)) {
    return Buffer.from(labels as number[]).toString("base64");
  }
  throw new Error("A GLS válasz nem tartalmaz nyomtatható címkét.");
}

function ensureGlsEnabledConfig() {
  return {
    apiBaseUrl: (process.env.GLS_API_BASE_URL || "https://api.test.mygls.hu").replace(/\/+$/, ""),
    username: requireEnv("GLS_API_USERNAME"),
    password: requireEnv("GLS_API_PASSWORD"),
    clientNumber: Number(requireEnv("GLS_CLIENT_NUMBER")),
    webshopEngine: process.env.GLS_WEBSHOP_ENGINE || "krausz-webshop",
    printerType: process.env.GLS_PRINTER_TYPE || "A4_2x2",
    pickupAddress: {
      Name: requireEnv("GLS_PICKUP_NAME"),
      Street: requireEnv("GLS_PICKUP_STREET"),
      HouseNumber: requireEnv("GLS_PICKUP_HOUSE_NUMBER"),
      HouseNumberInfo: process.env.GLS_PICKUP_HOUSE_NUMBER_INFO || undefined,
      City: requireEnv("GLS_PICKUP_CITY"),
      ZipCode: requireEnv("GLS_PICKUP_ZIP"),
      CountryIsoCode: (process.env.GLS_PICKUP_COUNTRY_ISO || "HU").toUpperCase(),
      ContactName: process.env.GLS_PICKUP_CONTACT_NAME || undefined,
      ContactPhone: process.env.GLS_PICKUP_CONTACT_PHONE || undefined,
      ContactEmail: process.env.GLS_PICKUP_CONTACT_EMAIL || undefined,
    } as GlsAddress,
  };
}

function createDeliveryAddress(order: IOrder): GlsAddress {
  const split = splitStreetAndHouseNumber(order.shippingAddress.street);
  return {
    Name: order.shippingAddress.name,
    Street: split.street,
    HouseNumber: split.houseNumber,
    HouseNumberInfo: split.houseNumberInfo,
    City: order.shippingAddress.city,
    ZipCode: order.shippingAddress.zip,
    CountryIsoCode: "HU",
    ContactName: order.shippingAddress.name,
    ContactPhone: order.shippingAddress.phone,
    ContactEmail: order.shippingAddress.email,
  };
}

function buildServiceList(order: IOrder) {
  if (!order.glsParcelPoint?.id) return undefined;
  return [
    {
      Code: "PSD",
      PSDParameter: {
        StringValue: order.glsParcelPoint.id,
      },
    },
  ];
}

export class GlsService {
  static async createLabelForOrder(order: IOrder): Promise<GlsPrintResult> {
    if (!order.glsParcelPoint?.id) {
      throw new Error("A rendeléshez nincs GLS csomagpont mentve.");
    }

    const config = ensureGlsEnabledConfig();
    if (!Number.isFinite(config.clientNumber) || config.clientNumber <= 0) {
      throw new Error("Érvénytelen GLS_CLIENT_NUMBER");
    }

    const payload = {
      Username: config.username,
      Password: passwordToByteArray(config.password),
      ClientNumberList: [config.clientNumber],
      WebshopEngine: config.webshopEngine,
      ParcelList: [
        {
          ClientNumber: config.clientNumber,
          ClientReference: order._id.toString(),
          Count: 1,
          PickupAddress: config.pickupAddress,
          DeliveryAddress: createDeliveryAddress(order),
          ServiceList: buildServiceList(order),
        },
      ],
      PrintPosition: 1,
      ShowPrintDialog: false,
      TypeOfPrinter: config.printerType,
    };

    const response = await fetch(`${config.apiBaseUrl}/ParcelService.svc/json/PrintLabels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`GLS API hiba (${response.status})`);
    }

    const data = (await response.json()) as GlsPrintLabelsResponse;
    const errors: GlsErrorInfo[] = data?.PrintLabelsErrorList || [];
    if (errors.length > 0) {
      const first = errors[0];
      throw new Error(first?.ErrorDescription || `GLS API hiba: ${first?.ErrorCode || "ismeretlen"}`);
    }

    const labelDataBase64 = normalizeLabels(data?.Labels);
    const firstInfo = data?.PrintLabelsInfoList?.[0];

    return {
      labelDataBase64,
      parcelId: firstInfo?.ParcelId,
      parcelNumber: firstInfo?.ParcelNumber ? String(firstInfo.ParcelNumber) : undefined,
      parcelNumberWithCheckdigit: data?.PrintDataInfoList?.[0]?.ParcelNumberWithCheckdigit
        ? String(data.PrintDataInfoList[0].ParcelNumberWithCheckdigit)
        : undefined,
      pin: firstInfo?.PIN || data?.PrintDataInfoList?.[0]?.PIN || undefined,
    };
  }
}

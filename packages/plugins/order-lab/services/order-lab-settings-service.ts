import dbConnect from "@wse/core/lib/db";
import type { FoxpostConnectionStatus } from "@wse/core/lib/foxpost";
import {
  buildFoxpostConfigFromFields,
  type FoxpostConfig,
} from "@wse/core/services/foxpost";
import OrderLabSettings from "@wse/plugin-order-lab/models/OrderLabSettings";

const SETTINGS_KEY = "default";

export type OrderLabFoxpostConnectionDto = {
  apiBaseUrl: string;
  username: string;
  isWeb: boolean;
  parcelSize: string;
  labelPageSize: string;
  hasPassword: boolean;
  hasApiKey: boolean;
  isConfigured: boolean;
  isSandbox: boolean;
  defaultSeedCount: number;
  defaultApmId: string;
};

export type SaveOrderLabFoxpostConnectionInput = {
  apiBaseUrl: string;
  username: string;
  password?: string;
  apiKey?: string;
  isWeb?: boolean;
  parcelSize?: string;
  labelPageSize?: string;
  defaultSeedCount?: number;
  defaultApmId?: string;
};

function maskUsername(username: string): string {
  if (username.length <= 2) return "*".repeat(username.length);
  return `${username.slice(0, 2)}${"*".repeat(Math.max(username.length - 2, 3))}`;
}

function toConnectionDto(doc: {
  foxpostApiBaseUrl?: string;
  foxpostUsername?: string;
  foxpostPassword?: string;
  foxpostApiKey?: string;
  foxpostIsWeb?: boolean;
  foxpostParcelSize?: string;
  foxpostLabelPageSize?: string;
  defaultSeedCount?: number;
  defaultApmId?: string;
}): OrderLabFoxpostConnectionDto {
  const apiBaseUrl = (doc.foxpostApiBaseUrl || "https://webapi-test.foxpost.hu/api").trim();
  const username = (doc.foxpostUsername || "").trim();
  const hasPassword = Boolean(doc.foxpostPassword?.trim());
  const hasApiKey = Boolean(doc.foxpostApiKey?.trim());
  const isConfigured = Boolean(username && hasPassword && hasApiKey && apiBaseUrl);
  const isSandbox = apiBaseUrl.includes("webapi-test");

  return {
    apiBaseUrl,
    username,
    isWeb: doc.foxpostIsWeb ?? !isSandbox,
    parcelSize: (doc.foxpostParcelSize || "M").trim(),
    labelPageSize: (doc.foxpostLabelPageSize || "A6").trim(),
    hasPassword,
    hasApiKey,
    isConfigured,
    isSandbox,
    defaultSeedCount: doc.defaultSeedCount ?? 3,
    defaultApmId: (doc.defaultApmId || "hu350").trim(),
  };
}

export class OrderLabSettingsService {
  static async getOrCreate() {
    await dbConnect();
    let doc = await OrderLabSettings.findOne({ singletonKey: SETTINGS_KEY });
    if (!doc) {
      doc = await OrderLabSettings.create({
        singletonKey: SETTINGS_KEY,
        foxpostApiBaseUrl: "https://webapi-test.foxpost.hu/api",
        foxpostIsWeb: false,
      });
    }
    return doc;
  }

  static async getFoxpostConnection(): Promise<OrderLabFoxpostConnectionDto> {
    const doc = await this.getOrCreate();
    return toConnectionDto(doc);
  }

  static async getFoxpostConnectionStatus(): Promise<FoxpostConnectionStatus> {
    const doc = await this.getOrCreate();
    const dto = toConnectionDto(doc);
    return {
      apiBaseUrl: dto.apiBaseUrl,
      isSandbox: dto.isSandbox,
      isWeb: dto.isWeb,
      username: dto.username,
      usernameMasked: dto.username ? maskUsername(dto.username) : "—",
      hasPassword: dto.hasPassword,
      hasApiKey: dto.hasApiKey,
      parcelSize: dto.parcelSize,
      labelPageSize: dto.labelPageSize,
    };
  }

  static async getFoxpostConfig(): Promise<FoxpostConfig> {
    const doc = await this.getOrCreate();
    const dto = toConnectionDto(doc);
    if (!dto.isConfigured) {
      throw new Error(
        "Foxpost sandbox kapcsolat nincs beállítva. Add meg a bejelentkezési adatokat az Order Lab → Beállítások menüben."
      );
    }

    return buildFoxpostConfigFromFields({
      apiBaseUrl: doc.foxpostApiBaseUrl!,
      username: doc.foxpostUsername!,
      password: doc.foxpostPassword!,
      apiKey: doc.foxpostApiKey!,
      isWeb: doc.foxpostIsWeb,
      parcelSize: doc.foxpostParcelSize,
      labelPageSize: doc.foxpostLabelPageSize,
    });
  }

  static async saveFoxpostConnection(input: SaveOrderLabFoxpostConnectionInput) {
    const doc = await this.getOrCreate();

    const apiBaseUrl = input.apiBaseUrl.trim();
    const username = input.username.trim();
    if (!apiBaseUrl || !username) {
      throw new Error("Az API URL és a felhasználónév kötelező.");
    }

    const isSandbox = apiBaseUrl.includes("webapi-test");
    doc.foxpostApiBaseUrl = apiBaseUrl;
    doc.foxpostUsername = username;
    doc.foxpostIsWeb = input.isWeb ?? !isSandbox;
    doc.foxpostParcelSize = (input.parcelSize || "M").trim();
    doc.foxpostLabelPageSize = (input.labelPageSize || "A6").trim();

    if (input.password?.trim()) {
      doc.foxpostPassword = input.password.trim();
    } else if (!doc.foxpostPassword?.trim()) {
      throw new Error("A jelszó megadása kötelező az első mentéskor.");
    }

    if (input.apiKey?.trim()) {
      doc.foxpostApiKey = input.apiKey.trim();
    } else if (!doc.foxpostApiKey?.trim()) {
      throw new Error("Az API kulcs megadása kötelező az első mentéskor.");
    }

    if (input.defaultSeedCount !== undefined) {
      doc.defaultSeedCount = Math.min(Math.max(Math.floor(input.defaultSeedCount), 1), 20);
    }
    if (input.defaultApmId?.trim()) {
      doc.defaultApmId = input.defaultApmId.trim();
    }

    await doc.save();
    return this.getFoxpostConnection();
  }
}

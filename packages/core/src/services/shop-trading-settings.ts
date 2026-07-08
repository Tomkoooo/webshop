import dbConnect from "@wse/core/lib/db";
import ShopTradingSetting from "@wse/core/models/ShopTradingSetting";
import { normalizeIso2 } from "@wse/core/lib/country-codes";

export type ShopTradingSettings = {
  shippingAllowedCountryCodes: string[];
  invoicingAllowedCountryCodes: string[];
  maxReservationMinutes: number | null;
};

function normalizeCodeList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out = new Set<string>();
  for (const item of raw) {
    const c = normalizeIso2(String(item ?? "").trim());
    if (c) out.add(c);
  }
  return [...out].sort((a, b) => a.localeCompare(b))
}

function normalizeReservationMinutes(raw: unknown): number | null {
  if (raw == null || raw === "") return null;
  const n = Math.round(Number(raw));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.max(30, n);
}

export class ShopTradingSettingsService {
  static async get(): Promise<ShopTradingSettings> {
    await dbConnect();
    const doc = await ShopTradingSetting.findOneAndUpdate(
      { key: "trading" },
      {
        $setOnInsert: {
          key: "trading",
          shippingAllowedCountryCodes: [],
          invoicingAllowedCountryCodes: [],
          maxReservationMinutes: null,
        },
      },
      { upsert: true, returnDocument: "after", lean: true }
    );
    return {
      shippingAllowedCountryCodes: normalizeCodeList(doc?.shippingAllowedCountryCodes),
      invoicingAllowedCountryCodes: normalizeCodeList(doc?.invoicingAllowedCountryCodes),
      maxReservationMinutes: normalizeReservationMinutes(doc?.maxReservationMinutes),
    };
  }

  static async update(input: Partial<ShopTradingSettings>): Promise<ShopTradingSettings> {
    await dbConnect();
    const prev = await this.get();

    const merged: ShopTradingSettings = {
      shippingAllowedCountryCodes:
        input.shippingAllowedCountryCodes !== undefined
          ? normalizeCodeList(input.shippingAllowedCountryCodes)
          : prev.shippingAllowedCountryCodes,
      invoicingAllowedCountryCodes:
        input.invoicingAllowedCountryCodes !== undefined
          ? normalizeCodeList(input.invoicingAllowedCountryCodes)
          : prev.invoicingAllowedCountryCodes,
      maxReservationMinutes:
        input.maxReservationMinutes !== undefined
          ? normalizeReservationMinutes(input.maxReservationMinutes)
          : prev.maxReservationMinutes,
    };

    await ShopTradingSetting.findOneAndUpdate(
      { key: "trading" },
      {
        $set: {
          shippingAllowedCountryCodes: merged.shippingAllowedCountryCodes,
          invoicingAllowedCountryCodes: merged.invoicingAllowedCountryCodes,
          maxReservationMinutes: merged.maxReservationMinutes,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return merged
  }
}

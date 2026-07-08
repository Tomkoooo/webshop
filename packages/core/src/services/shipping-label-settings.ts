import dbConnect from "@wse/core/lib/db"
import ShippingLabelSetting from "@wse/core/models/ShippingLabelSetting"

export type ShippingLabelSettings = {
  companyName: string
  companyStreet: string
  companyZip: string
  companyCity: string
  companyCountry: string
  companyPhone: string
  companyEmail: string
  taxNumber: string
  footerNote: string
}

const DEFAULTS: ShippingLabelSettings = {
  companyName: "",
  companyStreet: "",
  companyZip: "",
  companyCity: "",
  companyCountry: "Magyarország",
  companyPhone: "",
  companyEmail: "",
  taxNumber: "",
  footerNote: "",
}

function normalize(settings?: Partial<ShippingLabelSettings>): ShippingLabelSettings {
  return {
    companyName: settings?.companyName?.trim() || DEFAULTS.companyName,
    companyStreet: settings?.companyStreet?.trim() || DEFAULTS.companyStreet,
    companyZip: settings?.companyZip?.trim() || DEFAULTS.companyZip,
    companyCity: settings?.companyCity?.trim() || DEFAULTS.companyCity,
    companyCountry: settings?.companyCountry?.trim() || DEFAULTS.companyCountry,
    companyPhone: settings?.companyPhone?.trim() || DEFAULTS.companyPhone,
    companyEmail: settings?.companyEmail?.trim() || DEFAULTS.companyEmail,
    taxNumber: settings?.taxNumber?.trim() || DEFAULTS.taxNumber,
    footerNote: settings?.footerNote?.trim() || DEFAULTS.footerNote,
  }
}

export class ShippingLabelSettingsService {
  static defaults(): ShippingLabelSettings {
    return { ...DEFAULTS }
  }

  static async get(): Promise<ShippingLabelSettings> {
    await dbConnect()
    const doc = await ShippingLabelSetting.findOneAndUpdate(
      { key: "shipping-label" },
      { $setOnInsert: { key: "shipping-label", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    )
    return normalize(doc as Partial<ShippingLabelSettings>)
  }

  static async update(input: Partial<ShippingLabelSettings>): Promise<ShippingLabelSettings> {
    await dbConnect()
    const merged = { ...(await this.get()), ...input }
    const normalized = normalize(merged)
    await ShippingLabelSetting.findOneAndUpdate(
      { key: "shipping-label" },
      { $set: normalized },
      { upsert: true }
    )
    return normalized
  }
}

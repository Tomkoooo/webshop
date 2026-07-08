import dbConnect from "@wse/core/lib/db"
import BrandingSetting from "@wse/core/models/BrandingSetting"

export type BrandingSettings = {
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

const DEFAULTS: BrandingSettings = {
  brandName: "Generic Webshop",
  logoNav: "/generic-logo.svg",
  logoFooter: "/generic-logo.svg",
  logoHero: "/generic-hero.svg",
}

export class BrandingSettingsService {
  static async get() {
    await dbConnect()
    const doc = await BrandingSetting.findOneAndUpdate(
      { key: "branding" },
      { $setOnInsert: { key: "branding", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    )
    return {
      brandName: doc?.brandName || DEFAULTS.brandName,
      logoNav: doc?.logoNav || DEFAULTS.logoNav,
      logoFooter: doc?.logoFooter || DEFAULTS.logoFooter,
      logoHero: doc?.logoHero || DEFAULTS.logoHero,
    }
  }

  static async update(input: Partial<BrandingSettings>) {
    await dbConnect()
    const merged = { ...(await this.get()), ...input }
    await BrandingSetting.findOneAndUpdate({ key: "branding" }, { $set: merged }, { upsert: true })
    return merged
  }
}

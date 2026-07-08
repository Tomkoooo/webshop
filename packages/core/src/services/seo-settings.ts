import dbConnect from "@wse/core/lib/db"
import SeoSetting from "@wse/core/models/SeoSetting"

export type SeoSettings = {
  siteTitle: string
  siteDescription: string
  favicon: string
  ogImage: string
  twitterImage: string
  defaultLocale: string
  robotsIndex: boolean
  robotsFollow: boolean
  canonicalBaseUrl: string
}

const DEFAULTS: SeoSettings = {
  siteTitle: "Generic Webshop",
  siteDescription: "Lorem ipsum dolor sit amet.",
  favicon: "/generic-favicon.svg",
  ogImage: "/generic-hero.svg",
  twitterImage: "/generic-hero.svg",
  defaultLocale: "en_US",
  robotsIndex: true,
  robotsFollow: true,
  canonicalBaseUrl: "",
}

export class SeoSettingsService {
  static async get() {
    await dbConnect()
    const doc = await SeoSetting.findOneAndUpdate(
      { key: "seo" },
      { $setOnInsert: { key: "seo", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    )
    return {
      siteTitle: doc?.siteTitle || DEFAULTS.siteTitle,
      siteDescription: doc?.siteDescription || DEFAULTS.siteDescription,
      favicon: doc?.favicon || DEFAULTS.favicon,
      ogImage: doc?.ogImage || DEFAULTS.ogImage,
      twitterImage: doc?.twitterImage || DEFAULTS.twitterImage,
      defaultLocale: doc?.defaultLocale || DEFAULTS.defaultLocale,
      robotsIndex: doc?.robotsIndex ?? DEFAULTS.robotsIndex,
      robotsFollow: doc?.robotsFollow ?? DEFAULTS.robotsFollow,
      canonicalBaseUrl: doc?.canonicalBaseUrl || DEFAULTS.canonicalBaseUrl,
    }
  }

  static async update(input: Partial<SeoSettings>) {
    await dbConnect()
    const merged = { ...(await this.get()), ...input }
    const latest = await SeoSetting.findOne({ key: "seo" }).sort({ updatedAt: -1, _id: -1 }).lean()
    if (latest?._id) {
      await SeoSetting.findByIdAndUpdate(latest._id, { $set: { ...merged, key: "seo" } })
    } else {
      await SeoSetting.create({ key: "seo", ...merged })
    }
    return merged
  }
}

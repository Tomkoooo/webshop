import mongoose, { Document, Model, Schema } from "mongoose"

export interface ISeoSetting extends Document {
  key: string
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

const SeoSettingSchema = new Schema<ISeoSetting>(
  {
    key: { type: String, required: true, unique: true, default: "seo" },
    siteTitle: { type: String, default: "Generic Webshop" },
    siteDescription: { type: String, default: "Lorem ipsum dolor sit amet." },
    favicon: { type: String, default: "/generic-favicon.svg" },
    ogImage: { type: String, default: "/generic-hero.svg" },
    twitterImage: { type: String, default: "/generic-hero.svg" },
    defaultLocale: { type: String, default: "en_US" },
    robotsIndex: { type: Boolean, default: true },
    robotsFollow: { type: Boolean, default: true },
    canonicalBaseUrl: { type: String, default: "" },
  },
  { timestamps: true }
)

const SeoSetting: Model<ISeoSetting> =
  mongoose.models.SeoSetting || mongoose.model<ISeoSetting>("SeoSetting", SeoSettingSchema)

export default SeoSetting

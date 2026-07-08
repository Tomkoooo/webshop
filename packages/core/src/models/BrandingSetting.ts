import mongoose, { Document, Model, Schema } from "mongoose"

export interface IBrandingSetting extends Document {
  key: string
  brandName: string
  logoNav: string
  logoFooter: string
  logoHero: string
}

const BrandingSettingSchema = new Schema<IBrandingSetting>(
  {
    key: { type: String, required: true, unique: true, default: "branding" },
    brandName: { type: String, default: "Generic Webshop" },
    logoNav: { type: String, default: "/generic-logo.svg" },
    logoFooter: { type: String, default: "/generic-logo.svg" },
    logoHero: { type: String, default: "/generic-hero.svg" },
  },
  { timestamps: true }
)

const BrandingSetting: Model<IBrandingSetting> =
  mongoose.models.BrandingSetting || mongoose.model<IBrandingSetting>("BrandingSetting", BrandingSettingSchema)

export default BrandingSetting

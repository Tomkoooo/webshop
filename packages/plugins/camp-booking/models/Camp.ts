import mongoose, { Schema, Document, Model } from "mongoose"

export type CampPricingSettings = {
  multiChildDiscountPercent: number
  multiChildMinCount: number
  siblingDiscountPercent: number
  siblingMatchByLastName: boolean
}

export interface ICamp extends Document {
  slug: string
  title: string
  description?: string
  heroImage?: string
  sortOrder: number
  isPublished: boolean
  pricingSettings: CampPricingSettings
}

const CampPricingSettingsSchema = new Schema<CampPricingSettings>(
  {
    multiChildDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    multiChildMinCount: { type: Number, default: 2, min: 2 },
    siblingDiscountPercent: { type: Number, default: 0, min: 0, max: 100 },
    siblingMatchByLastName: { type: Boolean, default: true },
  },
  { _id: false }
)

const CampSchema = new Schema<ICamp>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    heroImage: { type: String },
    sortOrder: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: false },
    pricingSettings: { type: CampPricingSettingsSchema, default: () => ({}) },
  },
  { timestamps: true }
)

const Camp: Model<ICamp> =
  mongoose.models.Camp || mongoose.model<ICamp>("Camp", CampSchema)

export default Camp

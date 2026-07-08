import mongoose, { Schema, Document, Model, Types } from "mongoose"

export type CampPricingMode = "per_child" | "flat"
export type CampTicketKind = "base" | "addon"

export interface ICampTicketType extends Document {
  sessionId: Types.ObjectId
  name: string
  description?: string
  priceHuf: number
  pricingMode: CampPricingMode
  kind: CampTicketKind
  earlyBirdEndsAt?: Date
  earlyBirdPriceHuf?: number
  earlyBirdDiscountPercent?: number
  isActive: boolean
  sortOrder: number
}

const CampTicketTypeSchema = new Schema<ICampTicketType>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "CampSession", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priceHuf: { type: Number, required: true, min: 0 },
    pricingMode: { type: String, enum: ["per_child", "flat"], required: true },
    kind: { type: String, enum: ["base", "addon"], default: "base" },
    earlyBirdEndsAt: { type: Date },
    earlyBirdPriceHuf: { type: Number, min: 0 },
    earlyBirdDiscountPercent: { type: Number, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const CampTicketType: Model<ICampTicketType> =
  mongoose.models.CampTicketType ||
  mongoose.model<ICampTicketType>("CampTicketType", CampTicketTypeSchema)

export default CampTicketType

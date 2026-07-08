import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { CampPricingMode } from "./CampTicketType"
import type { CampChildDraft, CampPriceBreakdown } from "./CampCheckoutHold"

export interface ICampRegistration extends Document {
  campId: Types.ObjectId
  sessionId: Types.ObjectId
  ticketTypeId: Types.ObjectId
  holdId?: Types.ObjectId
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  children: CampChildDraft[]
  ticketTypeName: string
  sessionLabel: string
  campTitle: string
  pricingMode: CampPricingMode
  childCount: number
  totalHuf: number
  laptopAddonHuf?: number
  laptopAddonCount?: number
  priceBreakdown?: CampPriceBreakdown
  stripeSessionId?: string
  paidAt: Date
  status: "paid" | "cancelled"
}

const ChildSchema = new Schema<CampChildDraft>(
  {
    name: { type: String, required: true },
    lastName: { type: String },
    birthDate: { type: String, required: true },
    diningOption: { type: String, default: "Normál" },
    dietaryRequest: { type: String },
    allergies: { type: String },
    laptopRental: { type: Boolean, default: false },
    addonTicketIds: { type: [String], default: [] },
  },
  { _id: false }
)

const PriceBreakdownSchema = new Schema(
  {
    campSubtotalHuf: { type: Number, default: 0 },
    earlyBirdSavingsHuf: { type: Number, default: 0 },
    familyDiscountHuf: { type: Number, default: 0 },
    addonsHuf: { type: Number, default: 0 },
    familyDiscountPercent: { type: Number, default: 0 },
    lines: {
      type: [{ label: String, amountHuf: Number }],
      default: [],
    },
  },
  { _id: false }
)

const CampRegistrationSchema = new Schema<ICampRegistration>(
  {
    campId: { type: Schema.Types.ObjectId, ref: "Camp", required: true, index: true },
    sessionId: { type: Schema.Types.ObjectId, ref: "CampSession", required: true, index: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "CampTicketType", required: true },
    holdId: { type: Schema.Types.ObjectId, ref: "CampCheckoutHold" },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    children: { type: [ChildSchema], required: true },
    ticketTypeName: { type: String, required: true },
    sessionLabel: { type: String, required: true },
    campTitle: { type: String, required: true },
    pricingMode: { type: String, enum: ["per_child", "flat"], required: true },
    childCount: { type: Number, required: true, min: 1 },
    totalHuf: { type: Number, required: true, min: 0 },
    laptopAddonHuf: { type: Number, default: 0, min: 0 },
    laptopAddonCount: { type: Number, default: 0, min: 0 },
    priceBreakdown: { type: PriceBreakdownSchema },
    stripeSessionId: { type: String },
    paidAt: { type: Date, required: true },
    status: { type: String, enum: ["paid", "cancelled"], default: "paid" },
  },
  { timestamps: true }
)

const CampRegistration: Model<ICampRegistration> =
  mongoose.models.CampRegistration ||
  mongoose.model<ICampRegistration>("CampRegistration", CampRegistrationSchema)

export default CampRegistration

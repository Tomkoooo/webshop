import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { CampPricingMode } from "./CampTicketType"

export type CampHoldStatus =
  | "created"
  | "checkout_started"
  | "paid"
  | "finalized"
  | "expired"
  | "cancelled"
  | "failed"

export type CampChildDraft = {
  name: string
  lastName?: string
  birthDate: string
  diningOption?: string
  dietaryRequest?: string
  allergies?: string
  laptopRental?: boolean
  addonTicketIds?: string[]
}

export type CampPriceBreakdown = {
  campSubtotalHuf: number
  earlyBirdSavingsHuf: number
  familyDiscountHuf: number
  addonsHuf: number
  familyDiscountPercent: number
  lines: Array<{ label: string; amountHuf: number }>
}

const ChildDraftSchema = new Schema<CampChildDraft>(
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

const PriceBreakdownSchema = new Schema<CampPriceBreakdown>(
  {
    campSubtotalHuf: { type: Number, default: 0 },
    earlyBirdSavingsHuf: { type: Number, default: 0 },
    familyDiscountHuf: { type: Number, default: 0 },
    addonsHuf: { type: Number, default: 0 },
    familyDiscountPercent: { type: Number, default: 0 },
    lines: {
      type: [
        {
          label: String,
          amountHuf: Number,
        },
      ],
      default: [],
    },
  },
  { _id: false }
)

export interface ICampCheckoutHold extends Document {
  sessionId: Types.ObjectId
  ticketTypeId: Types.ObjectId
  campId: Types.ObjectId
  childCount: number
  buyerName: string
  buyerEmail: string
  buyerPhone: string
  children: CampChildDraft[]
  ticketTypeName: string
  sessionLabel: string
  pricingMode: CampPricingMode
  totalHuf: number
  laptopAddonHuf?: number
  laptopAddonCount?: number
  priceBreakdown?: CampPriceBreakdown
  status: CampHoldStatus
  expiresAt: Date
  stripeSessionId?: string
  stripePaymentIntentId?: string
  registrationId?: Types.ObjectId
  lastError?: string
}

const CampCheckoutHoldSchema = new Schema<ICampCheckoutHold>(
  {
    sessionId: { type: Schema.Types.ObjectId, ref: "CampSession", required: true, index: true },
    ticketTypeId: { type: Schema.Types.ObjectId, ref: "CampTicketType", required: true },
    campId: { type: Schema.Types.ObjectId, ref: "Camp", required: true },
    childCount: { type: Number, required: true, min: 1 },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerPhone: { type: String, required: true },
    children: { type: [ChildDraftSchema], required: true },
    ticketTypeName: { type: String, required: true },
    sessionLabel: { type: String, required: true },
    pricingMode: { type: String, enum: ["per_child", "flat"], required: true },
    totalHuf: { type: Number, required: true, min: 0 },
    laptopAddonHuf: { type: Number, default: 0, min: 0 },
    laptopAddonCount: { type: Number, default: 0, min: 0 },
    priceBreakdown: { type: PriceBreakdownSchema },
    status: {
      type: String,
      enum: ["created", "checkout_started", "paid", "finalized", "expired", "cancelled", "failed"],
      default: "created",
    },
    expiresAt: { type: Date, required: true, index: true },
    stripeSessionId: { type: String, index: true },
    stripePaymentIntentId: { type: String },
    registrationId: { type: Schema.Types.ObjectId, ref: "CampRegistration" },
    lastError: { type: String },
  },
  { timestamps: true }
)

const CampCheckoutHold: Model<ICampCheckoutHold> =
  mongoose.models.CampCheckoutHold ||
  mongoose.model<ICampCheckoutHold>("CampCheckoutHold", CampCheckoutHoldSchema)

export default CampCheckoutHold

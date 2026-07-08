import mongoose, { Schema, Document, Model } from "mongoose"

export interface IPressContact extends Document {
  name: string
  outlet: string
  email: string
  accessToken: string
  passwordHash?: string
  isActive: boolean
  inviteSentAt?: Date | null
  lastAccessAt?: Date | null
  notes?: string
}

const PressContactSchema = new Schema<IPressContact>(
  {
    name: { type: String, required: true, trim: true },
    outlet: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    accessToken: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },
    inviteSentAt: { type: Date, default: null },
    lastAccessAt: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
)

PressContactSchema.index({ email: 1 })
PressContactSchema.index({ isActive: 1 })

const PressContact: Model<IPressContact> =
  mongoose.models.PressContact || mongoose.model<IPressContact>("PressContact", PressContactSchema)

export default PressContact

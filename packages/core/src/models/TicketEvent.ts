import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITicketEvent extends Document {
  slug: string
  title: string
  description?: string
  /** Gross price in HUF for a single ticket (placeholder until checkout integration). */
  priceHuf: number
  capacity: number
  soldCount: number
  isPublished: boolean
}

const TicketEventSchema = new Schema<ITicketEvent>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    priceHuf: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 0 },
    soldCount: { type: Number, required: true, default: 0, min: 0 },
    isPublished: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
)

const TicketEvent: Model<ITicketEvent> =
  mongoose.models.TicketEvent || mongoose.model<ITicketEvent>("TicketEvent", TicketEventSchema)

export default TicketEvent

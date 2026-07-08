import mongoose, { Schema, Document, Model, Types } from "mongoose"

export type PressKitAccessEvent =
  | "portal_open"
  | "page_view"
  | "pdf_open"
  | "pdf_page_view"
  | "auth_failed"

export interface IPressKitAccessLog extends Document {
  contactId?: Types.ObjectId | null
  event: PressKitAccessEvent
  metadata?: Record<string, unknown>
  ipHash?: string
  createdAt: Date
}

const PressKitAccessLogSchema = new Schema<IPressKitAccessLog>(
  {
    contactId: { type: Schema.Types.ObjectId, ref: "PressContact", default: null },
    event: {
      type: String,
      enum: ["portal_open", "page_view", "pdf_open", "pdf_page_view", "auth_failed"],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipHash: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

PressKitAccessLogSchema.index({ contactId: 1, createdAt: -1 })
PressKitAccessLogSchema.index({ event: 1, createdAt: -1 })

const PressKitAccessLog: Model<IPressKitAccessLog> =
  mongoose.models.PressKitAccessLog ||
  mongoose.model<IPressKitAccessLog>("PressKitAccessLog", PressKitAccessLogSchema)

export default PressKitAccessLog

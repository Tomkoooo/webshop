import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { TBookAttendeeFieldValue } from "../lib/attendee-fields"

export type TBookVoucherStatus = "active" | "checked_in" | "void"

export type TBookVoucherEventSnapshot = {
  name: string
  startDate: Date
  endDate: Date
  startTime?: string | null
  endTime?: string | null
  locationAddress: string
}

export interface ITBookVoucher extends Document {
  organizationId?: Types.ObjectId | null
  eventId: Types.ObjectId
  bookingId: Types.ObjectId
  /** 0-based guest index within the booking. */
  attendeeIndex: number
  /** Opaque QR token — unique, no PII. */
  token: string
  status: TBookVoucherStatus
  displayName: string
  attendeeFields: Record<string, TBookAttendeeFieldValue>
  eventSnapshot: TBookVoucherEventSnapshot
  /** Shared multi-page PDF filename for the whole booking. */
  pdfFileName: string | null
  emailedAt: Date | null
  lastSentToEmail: string | null
  lastSentToName: string | null
  checkedInAt: Date | null
  checkedInByUserId: string | null
  createdAt: Date
  updatedAt: Date
}

const EventSnapshotSchema = new Schema<TBookVoucherEventSnapshot>(
  {
    name: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    locationAddress: { type: String, default: "" },
  },
  { _id: false }
)

const TBookVoucherSchema = new Schema<ITBookVoucher>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", default: null, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "TBookEvent", required: true, index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: "TBookBooking", required: true, index: true },
    attendeeIndex: { type: Number, required: true, min: 0 },
    token: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["active", "checked_in", "void"],
      default: "active",
      index: true,
    },
    displayName: { type: String, required: true },
    attendeeFields: { type: Schema.Types.Mixed, default: {} },
    eventSnapshot: { type: EventSnapshotSchema, required: true },
    pdfFileName: { type: String, default: null },
    emailedAt: { type: Date, default: null },
    lastSentToEmail: { type: String, default: null },
    lastSentToName: { type: String, default: null },
    checkedInAt: { type: Date, default: null },
    checkedInByUserId: { type: String, default: null },
  },
  { timestamps: true }
)

TBookVoucherSchema.index({ bookingId: 1, attendeeIndex: 1 }, { unique: true })
TBookVoucherSchema.index({ eventId: 1, status: 1 })

const TBookVoucher: Model<ITBookVoucher> =
  mongoose.models.TBookVoucher || mongoose.model<ITBookVoucher>("TBookVoucher", TBookVoucherSchema)

export default TBookVoucher

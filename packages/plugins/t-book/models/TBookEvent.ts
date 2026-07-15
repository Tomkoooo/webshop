import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { TBookStatus } from "../lib/schemas"
import type { TBookPriceBasis } from "../lib/vat"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"

export interface ITBookEvent extends Document {
  /** Denormalized org scope for admin queries. */
  organizationId?: Types.ObjectId | null
  /** Optional container group — events can also be standalone. */
  groupId: Types.ObjectId | null
  name: string
  description: string
  location: {
    address: string
    lat: number | null
    lng: number | null
    mapEmbedUrl: string
  }
  startDate: Date
  endDate: Date
  /** Optional start time on the first day (`HH:mm`, 24h). */
  startTime: string | null
  /** Optional end time on the last day (`HH:mm`, 24h). */
  endTime: string | null
  /** ISO 4217 currency for ticket pricing (defaults from org on create). */
  currency: string
  ticketFeeHuf: number
  ticketFeeMode: "per_person" | "per_booking" | "per_team"
  registrationUnit: "person" | "team"
  ticketPriceBasis: TBookPriceBasis
  ticketVatPercent: number
  /** null = unlimited. */
  capacity: number | null
  soldGuestCount: number
  heroImage: string
  /** Banner image for voucher PDF header (falls back to heroImage). */
  voucherHeaderImage: string
  /** When false, no vouchers are issued for this event. */
  vouchersEnabled: boolean
  /** Per-participant data fields collected at booking (name, age, nationality, etc.). */
  attendeeFieldSchema: TBookAttendeeFieldDef[]
  status: TBookStatus
  sortOrder: number
  createdAt: Date
  updatedAt: Date
}

const TBookEventSchema = new Schema<ITBookEvent>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", default: null, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: "TBookEventGroup", default: null, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    location: {
      address: { type: String, default: "" },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      mapEmbedUrl: { type: String, default: "" },
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: { type: String, default: null },
    endTime: { type: String, default: null },
    currency: { type: String, default: "HUF" },
    ticketFeeHuf: { type: Number, required: true, min: 0 },
    ticketFeeMode: {
      type: String,
      enum: ["per_person", "per_booking", "per_team"],
      default: "per_person",
    },
    registrationUnit: { type: String, enum: ["person", "team"], default: "person" },
    ticketPriceBasis: { type: String, enum: ["net", "gross"], default: "net" },
    ticketVatPercent: { type: Number, default: 27, min: 0, max: 100 },
    capacity: { type: Number, default: null },
    soldGuestCount: { type: Number, default: 0, min: 0 },
    heroImage: { type: String, default: "" },
    voucherHeaderImage: { type: String, default: "" },
    vouchersEnabled: { type: Boolean, default: true },
    attendeeFieldSchema: {
      type: [
        new Schema(
          {
            key: { type: String, required: true },
            label: { type: String, required: true },
            type: {
              type: String,
              enum: ["text", "email", "phone", "number", "date", "select"],
              required: true,
            },
            required: { type: Boolean, default: false },
            helpText: { type: String, default: "" },
            choices: {
              type: [
                new Schema(
                  { value: { type: String, required: true }, label: { type: String, required: true } },
                  { _id: false }
                ),
              ],
              default: undefined,
            },
            min: { type: Number },
            max: { type: Number },
            sortOrder: { type: Number, default: 0 },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

/** Nights between the event start/end dates (min 1). */
export function eventNights(event: Pick<ITBookEvent, "startDate" | "endDate">): number {
  const ms = new Date(event.endDate).getTime() - new Date(event.startDate).getTime()
  return Math.max(1, Math.round(ms / 86_400_000))
}

const TBookEvent: Model<ITBookEvent> =
  mongoose.models.TBookEvent || mongoose.model<ITBookEvent>("TBookEvent", TBookEventSchema)

export default TBookEvent

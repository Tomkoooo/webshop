import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { TBookPriceQuote, TBookSelections } from "../lib/pricing-types"
import type { TBookAttendeeFieldDef, TBookBookingAttendee } from "../lib/attendee-fields"

export type TBookBookingStatus =
  | "pending"
  | "checkout_started"
  | "paid"
  | "confirmed"
  | "cancelled"
  | "expired"

export type TBookInvoiceStatus = "none" | "issued" | "failed" | "reversed"

export type { TBookAttendeeFieldDef, TBookBookingAttendee } from "../lib/attendee-fields"

export type TBookCustomer = {
  name: string
  email: string
  phone: string
  note: string
}

export type TBookBillingType = "personal" | "company" | "sport"

export type TBookBillingInfo = {
  billingType: TBookBillingType
  name: string
  zip: string
  city: string
  street: string
  countryCode: string
  taxNumber: string
}

export interface ITBookBooking extends Document {
  organizationId?: Types.ObjectId | null
  groupId: Types.ObjectId | null
  eventId: Types.ObjectId
  hotelId: Types.ObjectId | null
  /** Denormalized for fast admin tables + stable history after edits. */
  eventName: string
  groupName: string
  hotelName: string
  customer: TBookCustomer
  billing: TBookBillingInfo | null
  /** Snapshot of event attendee field schema at booking time (for stable admin labels). */
  attendeeFieldSchema: TBookAttendeeFieldDef[]
  teamMemberFieldSchema: TBookAttendeeFieldDef[]
  teamMemberLimit: number | null
  playersPerTicket: number
  /** Per-ticket participant data — one row per guest when schema is configured. */
  attendees: TBookBookingAttendee[]
  guests: number
  nights: number
  selections: TBookSelections
  quote: TBookPriceQuote
  totalHuf: number
  /** ISO 4217 currency used for checkout. */
  currency: string
  status: TBookBookingStatus
  stripeSessionId: string | null
  stripePaymentIntentId: string | null
  paidAt: Date | null
  invoiceStatus: TBookInvoiceStatus
  invoiceId: string | null
  invoicePdfFileName: string | null
  invoiceError: string | null
  /** Storefront origin for post-payment redirect (e.g. WDF site). */
  checkoutReturnBaseUrl: string | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const CustomerSchema = new Schema<TBookCustomer>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    note: { type: String, default: "" },
  },
  { _id: false }
)

const BillingSchema = new Schema<TBookBillingInfo>(
  {
    billingType: {
      type: String,
      enum: ["personal", "company", "sport"],
      default: "personal",
    },
    name: { type: String, required: true },
    zip: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true },
    countryCode: { type: String, default: "HU" },
    taxNumber: { type: String, default: "" },
  },
  { _id: false }
)

const QuoteSchema = new Schema(
  {
    guests: { type: Number, required: true },
    nights: { type: Number, default: 0 },
    ticketSubtotalHuf: { type: Number, required: true },
    accommodationBaseHuf: { type: Number, default: 0 },
    accommodationOptionsHuf: { type: Number, default: 0 },
    accommodationSubtotalHuf: { type: Number, default: 0 },
    totalHuf: { type: Number, required: true },
    lines: {
      type: [{ key: String, label: String, amountHuf: Number }],
      default: [],
    },
  },
  { _id: false }
)

const AttendeeFieldChoiceSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
)

const AttendeeFieldDefSchema = new Schema(
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
    choices: { type: [AttendeeFieldChoiceSchema], default: undefined },
    min: { type: Number },
    max: { type: Number },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

const BookingTeamMemberSchema = new Schema(
  {
    fields: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false }
)

const BookingAttendeeSchema = new Schema(
  {
    fields: { type: Schema.Types.Mixed, default: {} },
    members: { type: [BookingTeamMemberSchema], default: undefined },
  },
  { _id: false }
)

const TBookBookingSchema = new Schema<ITBookBooking>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", default: null, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: "TBookEventGroup", default: null, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "TBookEvent", required: true, index: true },
    hotelId: { type: Schema.Types.ObjectId, ref: "TBookHotel", default: null, index: true },
    eventName: { type: String, required: true },
    groupName: { type: String, default: "" },
    hotelName: { type: String, default: "" },
    customer: { type: CustomerSchema, required: true },
    billing: { type: BillingSchema, default: null },
    attendeeFieldSchema: { type: [AttendeeFieldDefSchema], default: [] },
    teamMemberFieldSchema: { type: [AttendeeFieldDefSchema], default: [] },
    teamMemberLimit: { type: Number, default: null },
    playersPerTicket: { type: Number, default: 1, min: 1 },
    attendees: { type: [BookingAttendeeSchema], default: [] },
    guests: { type: Number, required: true, min: 1 },
    nights: { type: Number, default: 0, min: 0 },
    selections: { type: Schema.Types.Mixed, default: {} },
    quote: { type: QuoteSchema, required: true },
    totalHuf: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "HUF" },
    status: {
      type: String,
      enum: ["pending", "checkout_started", "paid", "confirmed", "cancelled", "expired"],
      default: "pending",
      index: true,
    },
    stripeSessionId: { type: String, default: null, index: true },
    stripePaymentIntentId: { type: String, default: null },
    paidAt: { type: Date, default: null },
    invoiceStatus: {
      type: String,
      enum: ["none", "issued", "failed", "reversed"],
      default: "none",
    },
    invoiceId: { type: String, default: null },
    invoicePdfFileName: { type: String, default: null },
    invoiceError: { type: String, default: null },
    checkoutReturnBaseUrl: { type: String, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
)

TBookBookingSchema.index({ createdAt: -1 })
TBookBookingSchema.index({ "customer.email": 1 })

const TBookBooking: Model<ITBookBooking> =
  mongoose.models.TBookBooking ||
  mongoose.model<ITBookBooking>("TBookBooking", TBookBookingSchema)

export default TBookBooking

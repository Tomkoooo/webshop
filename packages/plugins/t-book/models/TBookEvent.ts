import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { TBookStatus } from "../lib/schemas"
import type { TBookPriceBasis } from "../lib/vat"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"
import type {
  TBookEligibilityPreset,
  TBookEligibilityRulesConfig,
  TBookLegacyEligibilityPreset,
} from "../lib/eligibility"
import type { TBookPricingRule } from "../lib/pricing-rules"

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
  /** Players per ticket/team (1 = individual). Drives roster forms and hotel headcount. */
  playersPerTicket: number
  teamMemberLimit: number | null
  teamMemberFieldSchema: TBookAttendeeFieldDef[]
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
  /** How event fields combine with group defaults (`extend` or `replace`). */
  attendeeFieldSchemaMode: "extend" | "replace"
  /** Modern presets plus legacy darts values still stored on older events. */
  eligibilityPreset: TBookEligibilityPreset | TBookLegacyEligibilityPreset
  eligibilityMinAge: number | null
  eligibilityMaxAge: number | null
  eligibilityAllowedGenders: string[]
  eligibilityBirthDateFieldKey: string | null
  eligibilityGenderFieldKey: string | null
  /** Form-field based eligibility (AND/OR + ops / regex). */
  eligibilityFormRules: TBookEligibilityRulesConfig | null
  /** Event-level pricing special cases (free entry, hotel discount, off-site surcharge, …). */
  pricingRules: TBookPricingRule[]
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
    playersPerTicket: { type: Number, default: 1, min: 1, max: 100 },
    teamMemberLimit: { type: Number, default: null, min: 1, max: 100 },
    teamMemberFieldSchema: {
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
    attendeeFieldSchemaMode: {
      type: String,
      enum: ["extend", "replace"],
      default: "extend",
    },
    eligibilityPreset: {
      type: String,
      enum: ["none", "under18", "under18_female", "women", "custom", "form_rules"],
      default: "none",
    },
    eligibilityMinAge: { type: Number, default: null, min: 0, max: 120 },
    eligibilityMaxAge: { type: Number, default: null, min: 0, max: 120 },
    eligibilityAllowedGenders: { type: [String], default: [] },
    eligibilityBirthDateFieldKey: { type: String, default: null },
    eligibilityGenderFieldKey: { type: String, default: null },
    eligibilityFormRules: {
      type: new Schema(
        {
          logic: { type: String, enum: ["and", "or"], default: "and" },
          rules: {
            type: [
              new Schema(
                {
                  id: { type: String, required: true },
                  fieldKey: { type: String, required: true },
                  op: { type: String, required: true },
                  value: { type: String, default: "" },
                  message: { type: String, default: "" },
                },
                { _id: false }
              ),
            ],
            default: [],
          },
        },
        { _id: false }
      ),
      default: null,
    },
    pricingRules: {
      type: [
        new Schema(
          {
            id: { type: String, required: true },
            enabled: { type: Boolean, default: true },
            label: { type: String, default: "Ármódosítás" },
            when: {
              type: String,
              enum: ["always", "with_hotel", "without_hotel", "with_package"],
              required: true,
            },
            action: {
              type: String,
              enum: ["set_ticket_fee", "adjust_ticket", "adjust_accommodation", "adjust_total"],
              required: true,
            },
            amount: { type: Number, default: 0 },
            amountMode: {
              type: String,
              enum: [
                "fixed",
                "per_person",
                "per_accommodation_guest",
                "percent_accommodation",
                "percent_ticket",
              ],
              default: "fixed",
            },
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

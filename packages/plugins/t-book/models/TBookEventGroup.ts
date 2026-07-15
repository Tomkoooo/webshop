import mongoose, { Schema, Document, Model } from "mongoose"
import type { TBookStatus } from "../lib/schemas"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"
import type { TBookOptionDef } from "../lib/pricing-types"
import type { TBookPriceBasis } from "../lib/vat"

export interface ITBookEventGroup extends Document {
  /** Owning organization (multi-tenant scoping). */
  organizationId?: mongoose.Types.ObjectId | null
  name: string
  description: string
  status: TBookStatus
  /** Default booking options inherited by every event in this group. */
  defaultBookingOptions: TBookOptionDef[]
  /** Base registration fields inherited by events (unless an event replaces them). */
  defaultAttendeeFieldSchema: TBookAttendeeFieldDef[]
  defaultPriceBasis: TBookPriceBasis
  defaultVatPercent: number
  /** Show this group on the public tBook integrations directory. */
  listOnTBookSite: boolean
  /** Public card title (defaults to group name when empty). */
  listingTitle: string
  /** Link to the customer booking page. */
  listingUrl: string
  /** Cover image for the public directory card. */
  listingImage: string
  /** Default event cover when an event has no hero image. */
  defaultHeroImage: string
  /** Default header image on voucher PDFs for events in this group. */
  voucherHeaderImage: string
  /** SHA-256 hash of the group API key. The plaintext is shown to the admin once. */
  apiKeyHash: string
  /** Non-secret display hint, e.g. `tbk_ab12…89ef`. */
  apiKeyHint: string
  apiKeyCreatedAt: Date
  createdAt: Date
  updatedAt: Date
}

const OptionChoiceSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    priceHuf: { type: Number, default: 0 },
    priceMode: {
      type: String,
      enum: ["fixed", "per_person", "per_night", "per_person_per_night", "percent"],
      default: "fixed",
    },
  },
  { _id: false }
)

const OptionDefSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["select", "multiselect", "number", "checkbox"], required: true },
    required: { type: Boolean, default: false },
    defaultValue: { type: Schema.Types.Mixed, default: null },
    choices: { type: [OptionChoiceSchema], default: undefined },
    unitPriceHuf: { type: Number },
    priceMode: {
      type: String,
      enum: ["fixed", "per_person", "per_night", "per_person_per_night", "percent"],
    },
    min: { type: Number },
    max: { type: Number },
    dependsOn: {
      type: new Schema(
        {
          key: { type: String, required: true },
          values: { type: [String], default: [] },
        },
        { _id: false }
      ),
      default: null,
    },
    sortOrder: { type: Number, default: 0 },
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

const TBookEventGroupSchema = new Schema<ITBookEventGroup>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", default: null, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    defaultBookingOptions: { type: [OptionDefSchema], default: [] },
    defaultAttendeeFieldSchema: { type: [AttendeeFieldDefSchema], default: [] },
    defaultPriceBasis: { type: String, enum: ["net", "gross"], default: "net" },
    defaultVatPercent: { type: Number, default: 27, min: 0, max: 100 },
    listOnTBookSite: { type: Boolean, default: false },
    listingTitle: { type: String, default: "" },
    listingUrl: { type: String, default: "" },
    listingImage: { type: String, default: "" },
    defaultHeroImage: { type: String, default: "" },
    voucherHeaderImage: { type: String, default: "" },
    apiKeyHash: { type: String, required: true, index: true },
    apiKeyHint: { type: String, required: true },
    apiKeyCreatedAt: { type: Date, required: true },
  },
  { timestamps: true }
)

const TBookEventGroup: Model<ITBookEventGroup> =
  mongoose.models.TBookEventGroup ||
  mongoose.model<ITBookEventGroup>("TBookEventGroup", TBookEventGroupSchema)

export default TBookEventGroup

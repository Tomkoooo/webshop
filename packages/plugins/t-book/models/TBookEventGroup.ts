import mongoose, { Schema, Document, Model } from "mongoose"
import type { TBookStatus } from "../lib/schemas"
import type { TBookOptionDef } from "../lib/pricing-types"
import type { TBookPriceBasis } from "../lib/vat"

export interface ITBookEventGroup extends Document {
  name: string
  description: string
  status: TBookStatus
  /** Default booking options inherited by every event in this group. */
  defaultBookingOptions: TBookOptionDef[]
  defaultPriceBasis: TBookPriceBasis
  defaultVatPercent: number
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

const TBookEventGroupSchema = new Schema<ITBookEventGroup>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    defaultBookingOptions: { type: [OptionDefSchema], default: [] },
    defaultPriceBasis: { type: String, enum: ["net", "gross"], default: "net" },
    defaultVatPercent: { type: Number, default: 27, min: 0, max: 100 },
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

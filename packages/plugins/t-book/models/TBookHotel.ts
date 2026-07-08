import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { TBookHotelPricing } from "../lib/pricing-types"
import type { TBookStatus } from "../lib/schemas"

export interface ITBookHotel extends Document {
  /** Hotels are owned by the event group (shared across events). */
  groupId: Types.ObjectId | null
  /** @deprecated Legacy per-event hotels — migrated to groupId on read. */
  eventId: Types.ObjectId | null
  name: string
  description: string
  address: string
  distanceFromVenueKm: number | null
  contactEmail: string
  contactPhone: string
  gallery: string[]
  pricing: TBookHotelPricing
  status: TBookStatus
  sortOrder: number
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

const RoomTypeSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    baseRateHuf: { type: Number, required: true, min: 0 },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

const AddonGroupSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    sortOrder: { type: Number, default: 0 },
    options: { type: [OptionDefSchema], default: [] },
  },
  { _id: false }
)

const TBookHotelSchema = new Schema<ITBookHotel>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "TBookEventGroup", default: null, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "TBookEvent", default: null, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    distanceFromVenueKm: { type: Number, default: null, min: 0 },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    gallery: { type: [String], default: [] },
    pricing: {
      priceBasis: { type: String, enum: ["net", "gross"], default: "net" },
      vatPercent: { type: Number, default: 27, min: 0, max: 100 },
      roomTypes: { type: [RoomTypeSchema], default: [] },
      addonGroups: { type: [AddonGroupSchema], default: [] },
      baseRateHuf: { type: Number, min: 0 },
      baseRateMode: {
        type: String,
        enum: ["per_person_per_night", "per_night", "per_person", "per_booking"],
      },
      options: { type: [OptionDefSchema], default: undefined },
    },
    status: { type: String, enum: ["draft", "active", "archived"], default: "draft", index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
)

const TBookHotel: Model<ITBookHotel> =
  mongoose.models.TBookHotel || mongoose.model<ITBookHotel>("TBookHotel", TBookHotelSchema)

export default TBookHotel

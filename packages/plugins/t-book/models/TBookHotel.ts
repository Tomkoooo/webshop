import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { TBookHotelPricing } from "../lib/pricing-types"
import type { TBookStatus } from "../lib/schemas"
import type { TBookAttendeeFieldDef } from "../lib/attendee-fields"

export interface ITBookHotel extends Document {
  organizationId?: Types.ObjectId | null
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
  /** ISO 4217 currency for hotel pricing (defaults from org on create). */
  currency: string
  /**
   * Max accommodation guests across active bookings for this hotel.
   * Null = unlimited (package/room inventory may still apply).
   */
  bookingCapacity: number | null
  /**
   * Shared room/package-unit pool for this hotel (across all package types).
   * E.g. 20 rooms that can be booked as single or double packages.
   * Null = unlimited (per-package inventoryUnits may still apply).
   */
  roomInventory: number | null
  /** Extra registration fields collected when this hotel is selected. */
  registrationFieldSchema: TBookAttendeeFieldDef[]
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

const PackageDealSchema = new Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    nights: { type: Number, required: true, min: 1 },
    priceHuf: { type: Number, required: true, min: 0 },
    maxGuests: { type: Number, default: null, min: 1, max: 50 },
    inventoryUnits: { type: Number, default: null, min: 0, max: 10000 },
    roomTypeKey: { type: String, default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

const ExtrasSectionSchema = new Schema(
  {
    label: { type: String, required: true },
    description: { type: String, default: "" },
    options: { type: [OptionDefSchema], default: [] },
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

const RegistrationFieldChoiceSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
  },
  { _id: false }
)

const RegistrationFieldDefSchema = new Schema(
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
    choices: { type: [RegistrationFieldChoiceSchema], default: undefined },
    min: { type: Number },
    max: { type: Number },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
)

const TBookHotelSchema = new Schema<ITBookHotel>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", default: null, index: true },
    groupId: { type: Schema.Types.ObjectId, ref: "TBookEventGroup", default: null, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: "TBookEvent", default: null, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    distanceFromVenueKm: { type: Number, default: null, min: 0 },
    contactEmail: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    gallery: { type: [String], default: [] },
    currency: { type: String, default: "HUF" },
    bookingCapacity: { type: Number, default: null, min: 0 },
    roomInventory: { type: Number, default: null, min: 0 },
    registrationFieldSchema: { type: [RegistrationFieldDefSchema], default: [] },
    pricing: {
      priceBasis: { type: String, enum: ["net", "gross"], default: "net" },
      vatPercent: { type: Number, default: 27, min: 0, max: 100 },
      accommodationMode: {
        type: String,
        enum: ["room_nights", "packages", "both"],
        default: undefined,
      },
      roomTypes: { type: [RoomTypeSchema], default: [] },
      packages: { type: [PackageDealSchema], default: [] },
      extrasSection: { type: ExtrasSectionSchema, default: null },
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

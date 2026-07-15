import mongoose, { Schema, Document, Model, Types } from "mongoose"

export type TBookOrganizationStatus = "active" | "suspended"

export interface ITBookOrganizationSettings {
  currency: string
}

export interface ITBookOrganization extends Document {
  name: string
  slug: string
  status: TBookOrganizationStatus
  settings: ITBookOrganizationSettings
  createdBy: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

const TBookOrganizationSchema = new Schema<ITBookOrganization>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["active", "suspended"], default: "active", index: true },
    settings: {
      currency: { type: String, default: "HUF" },
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
)

const TBookOrganization: Model<ITBookOrganization> =
  mongoose.models.TBookOrganization ||
  mongoose.model<ITBookOrganization>("TBookOrganization", TBookOrganizationSchema)

export default TBookOrganization

import mongoose, { Schema, Document, Model, Types } from "mongoose"
import type { TBookPermission } from "../lib/permissions"

export interface ITBookOrgRole extends Document {
  organizationId: Types.ObjectId
  name: string
  description: string
  permissions: TBookPermission[]
  isBuiltIn: boolean
  createdAt: Date
  updatedAt: Date
}

const TBookOrgRoleSchema = new Schema<ITBookOrgRole>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    permissions: { type: [String], default: [] },
    isBuiltIn: { type: Boolean, default: false },
  },
  { timestamps: true }
)

TBookOrgRoleSchema.index({ organizationId: 1, name: 1 }, { unique: true })

const TBookOrgRole: Model<ITBookOrgRole> =
  mongoose.models.TBookOrgRole || mongoose.model<ITBookOrgRole>("TBookOrgRole", TBookOrgRoleSchema)

export default TBookOrgRole

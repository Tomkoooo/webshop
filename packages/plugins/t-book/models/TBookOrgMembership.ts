import mongoose, { Schema, Document, Model, Types } from "mongoose"

export type TBookOrgMembershipStatus = "active" | "invited" | "disabled"

export interface ITBookOrgMembership extends Document {
  organizationId: Types.ObjectId
  userId: Types.ObjectId
  roleIds: Types.ObjectId[]
  status: TBookOrgMembershipStatus
  createdAt: Date
  updatedAt: Date
}

const TBookOrgMembershipSchema = new Schema<ITBookOrgMembership>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roleIds: { type: [Schema.Types.ObjectId], ref: "TBookOrgRole", default: [] },
    status: { type: String, enum: ["active", "invited", "disabled"], default: "active", index: true },
  },
  { timestamps: true }
)

TBookOrgMembershipSchema.index({ organizationId: 1, userId: 1 }, { unique: true })

const TBookOrgMembership: Model<ITBookOrgMembership> =
  mongoose.models.TBookOrgMembership ||
  mongoose.model<ITBookOrgMembership>("TBookOrgMembership", TBookOrgMembershipSchema)

export default TBookOrgMembership

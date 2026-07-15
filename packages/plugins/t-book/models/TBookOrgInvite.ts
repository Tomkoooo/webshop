import mongoose, { Schema, Document, Model, Types } from "mongoose"

export interface ITBookOrgInvite extends Document {
  organizationId: Types.ObjectId
  email: string
  roleIds: Types.ObjectId[]
  tokenHash: string
  expiresAt: Date
  invitedBy: Types.ObjectId | null
  acceptedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const TBookOrgInviteSchema = new Schema<ITBookOrgInvite>(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "TBookOrganization", required: true, index: true },
    email: { type: String, required: true, index: true },
    roleIds: { type: [Schema.Types.ObjectId], ref: "TBookOrgRole", default: [] },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

TBookOrgInviteSchema.index({ organizationId: 1, email: 1 })

const TBookOrgInvite: Model<ITBookOrgInvite> =
  mongoose.models.TBookOrgInvite ||
  mongoose.model<ITBookOrgInvite>("TBookOrgInvite", TBookOrgInviteSchema)

export default TBookOrgInvite

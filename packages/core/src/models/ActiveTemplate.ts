import mongoose, { Schema, Document, Model } from "mongoose"

export interface IActiveTemplate extends Document {
  key: "active"
  templateId: string
  templateVersion: string
  activatedAt: Date
  activatedBy?: string
}

const ActiveTemplateSchema = new Schema<IActiveTemplate>(
  {
    key: { type: String, required: true, unique: true, default: "active", enum: ["active"] },
    templateId: { type: String, required: true },
    templateVersion: { type: String, required: true },
    activatedAt: { type: Date, required: true, default: () => new Date() },
    activatedBy: { type: String },
  },
  { timestamps: true }
)

const ActiveTemplate: Model<IActiveTemplate> =
  mongoose.models.ActiveTemplate ||
  mongoose.model<IActiveTemplate>("ActiveTemplate", ActiveTemplateSchema)

export default ActiveTemplate

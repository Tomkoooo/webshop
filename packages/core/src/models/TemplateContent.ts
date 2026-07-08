import mongoose, { Schema, Document, Model } from "mongoose"

export interface ITemplateContent extends Document {
  templateId: string
  pageKey: string
  /** Published / live JSON snapshot (required when document exists). */
  value: string
  /** Draft JSON — when unset, editor baseline is `value`. */
  draftValue?: string
  updatedBy?: string
  publishedAt?: Date
  publishedBy?: string
}

const TemplateContentSchema = new Schema<ITemplateContent>(
  {
    templateId: { type: String, required: true, index: true },
    pageKey: { type: String, required: true },
    value: { type: String, required: true },
    draftValue: { type: String },
    updatedBy: { type: String },
    publishedAt: { type: Date },
    publishedBy: { type: String },
  },
  { timestamps: true }
)

TemplateContentSchema.index({ templateId: 1, pageKey: 1 }, { unique: true })

const TemplateContent: Model<ITemplateContent> =
  mongoose.models.TemplateContent ||
  mongoose.model<ITemplateContent>("TemplateContent", TemplateContentSchema)

export default TemplateContent

import mongoose, { Document, Model, Schema } from "mongoose";

export type LegalDocumentKey = "impresszum" | "terms" | "gdpr";

export interface ILegalDocument extends Document {
  key: LegalDocumentKey;
  title: string;
  fileName: string;
  uploadedAt: Date;
}

const LegalDocumentSchema = new Schema<ILegalDocument>(
  {
    key: {
      type: String,
      enum: ["impresszum", "terms", "gdpr"],
      required: true,
      unique: true,
    },
    title: { type: String, required: true },
    fileName: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const LegalDocument: Model<ILegalDocument> =
  mongoose.models.LegalDocument ||
  mongoose.model<ILegalDocument>("LegalDocument", LegalDocumentSchema);

export default LegalDocument;

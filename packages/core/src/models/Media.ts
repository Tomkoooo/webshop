import mongoose, { Schema, Document } from "mongoose";

export interface IMedia extends Document {
  filename: string;
  originalName: string;
  hash: string;
  useCount: number;
  mimeType: string;
  size: number;
  /** File bytes (required for new uploads; legacy rows may rely on disk until re-uploaded). */
  data?: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const MediaSchema = new Schema<IMedia>(
  {
    filename: { type: String, required: true, unique: true },
    originalName: { type: String, required: true },
    hash: { type: String, required: true, index: true },
    useCount: { type: Number, default: 0 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Media || mongoose.model<IMedia>("Media", MediaSchema);

import mongoose, { Document, Model, Schema } from "mongoose";

export interface IFeatureFlag extends Document {
  key: string;
  label: string;
  description?: string;
  enabled: boolean;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const FeatureFlag: Model<IFeatureFlag> =
  mongoose.models.FeatureFlag || mongoose.model<IFeatureFlag>("FeatureFlag", FeatureFlagSchema);

export default FeatureFlag;

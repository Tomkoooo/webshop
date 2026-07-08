import mongoose, { Schema, Document } from "mongoose";

export interface IOrderLabSettings extends Document {
  singletonKey: string;
  foxpostApiBaseUrl?: string;
  foxpostUsername?: string;
  foxpostPassword?: string;
  foxpostApiKey?: string;
  foxpostIsWeb?: boolean;
  foxpostParcelSize?: string;
  foxpostLabelPageSize?: string;
  defaultSeedCount?: number;
  defaultApmId?: string;
  updatedAt: Date;
  createdAt: Date;
}

const OrderLabSettingsSchema = new Schema<IOrderLabSettings>(
  {
    singletonKey: { type: String, required: true, unique: true, default: "default" },
    foxpostApiBaseUrl: { type: String },
    foxpostUsername: { type: String },
    foxpostPassword: { type: String },
    foxpostApiKey: { type: String },
    foxpostIsWeb: { type: Boolean },
    foxpostParcelSize: { type: String, default: "M" },
    foxpostLabelPageSize: { type: String, default: "A6" },
    defaultSeedCount: { type: Number, default: 3, min: 1, max: 20 },
    defaultApmId: { type: String, default: "hu350" },
  },
  { timestamps: true, collection: "order_lab_settings" }
);

const OrderLabSettings =
  mongoose.models.OrderLabSettings ||
  mongoose.model<IOrderLabSettings>("OrderLabSettings", OrderLabSettingsSchema);

export default OrderLabSettings;

import mongoose, { Schema, Document, Model } from "mongoose";

export interface IShopContent extends Document {
  key: string;
  value: string;
  section: string;
}

const ShopContentSchema = new Schema<IShopContent>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    section: { type: String, required: true },
  },
  { timestamps: true }
);

const ShopContent: Model<IShopContent> = 
  mongoose.models.ShopContent || mongoose.model<IShopContent>("ShopContent", ShopContentSchema);

export default ShopContent;

import mongoose, { Schema, Document, Model } from "mongoose";

export type FeaturedProductsMode = "auto" | "manual" | "byCategory";

export interface IShopFeaturedSetting extends Document {
  key: string;
  mode: FeaturedProductsMode;
  /** Ordered product ids for manual mode. */
  manualProductIds: string[];
  /** Ordered category ids for byCategory mode (category B before A, etc.). */
  orderedCategoryIds: string[];
  maxItems: number;
  /** Cap products taken from each category in byCategory mode (0 = no cap). */
  perCategoryLimit: number;
}

const ShopFeaturedSettingSchema = new Schema<IShopFeaturedSetting>(
  {
    key: { type: String, required: true, unique: true, default: "featured" },
    mode: {
      type: String,
      enum: ["auto", "manual", "byCategory"],
      default: "auto",
    },
    manualProductIds: [{ type: String, trim: true }],
    orderedCategoryIds: [{ type: String, trim: true }],
    maxItems: { type: Number, default: 24, min: 1, max: 48 },
    perCategoryLimit: { type: Number, default: 0, min: 0, max: 48 },
  },
  { timestamps: true }
);

const ShopFeaturedSetting: Model<IShopFeaturedSetting> =
  mongoose.models.ShopFeaturedSetting ||
  mongoose.model<IShopFeaturedSetting>("ShopFeaturedSetting", ShopFeaturedSettingSchema);

export default ShopFeaturedSetting;

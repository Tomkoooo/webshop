import mongoose, { Schema, Document, Model } from "mongoose";

export type ShippingProviderKind = "standard" | "gls" | "foxpost";

export interface IShippingMethod extends Document {
  name: string;
  grossPrice: number;
  isActive: boolean;
  /** Links admin pricing to checkout parcel picker (GLS map / Foxpost APT). */
  provider: ShippingProviderKind;
  /** Optional HTML shown at checkout when this method is selected (parcel locker instructions). */
  descriptionHtml?: string;
}

const ShippingMethodSchema = new Schema<IShippingMethod>(
  {
    name: { type: String, required: true },
    grossPrice: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    provider: {
      type: String,
      enum: ["standard", "gls", "foxpost"],
      default: "standard",
    },
    descriptionHtml: { type: String, default: "" },
  },
  { timestamps: true }
);

const ShippingMethod: Model<IShippingMethod> = 
  mongoose.models.ShippingMethod || mongoose.model<IShippingMethod>("ShippingMethod", ShippingMethodSchema);

export default ShippingMethod;

import mongoose, { Schema, Document, Model } from "mongoose";

export enum DiscountType {
  PERCENTAGE = "percentage",
  FIXED_AMOUNT = "fixed_amount",
  FREE_SHIPPING = "free_shipping",
  PRODUCT_PRICE = "product_price",
}

export enum CouponProductPriceMode {
  PERCENTAGE = "percentage",
  FIXED_NET = "fixed_net",
  FIXED_GROSS = "fixed_gross",
}

export interface ICouponProductPriceRule {
  product: mongoose.Types.ObjectId;
  /** When omitted, the rule applies to every variant of the product. */
  variantId?: string;
  mode: CouponProductPriceMode;
  value: number;
}

export interface ICoupon extends Document {
  code: string;
  type: DiscountType;
  value: number; // For percentage or fixed amount
  minCartValue?: number;
  startDate: Date;
  endDate: Date;
  applicableProducts: mongoose.Types.ObjectId[];
  applicableUsers: mongoose.Types.ObjectId[];
  productPriceRules?: ICouponProductPriceRule[];
  maxUses?: number;
  /** Max redemptions per user (matched by account or billing e-mail). */
  maxUsesPerUser?: number;
  usedCount: number;
  isActive: boolean;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    type: { 
      type: String, 
      enum: Object.values(DiscountType), 
      required: true,
      default: DiscountType.PERCENTAGE
    },
    value: { type: Number, required: true, default: 0 },
    minCartValue: { type: Number, default: 0 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicableProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    applicableUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    productPriceRules: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        variantId: { type: String },
        mode: {
          type: String,
          enum: Object.values(CouponProductPriceMode),
          required: true,
        },
        value: { type: Number, required: true, min: 0 },
      },
    ],
    maxUses: { type: Number },
    maxUsesPerUser: { type: Number },
    usedCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Coupon: Model<ICoupon> = 
  mongoose.models.Coupon || mongoose.model<ICoupon>("Coupon", CouponSchema);

export default Coupon;

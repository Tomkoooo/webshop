import mongoose, { Schema, Document, Model } from "mongoose";

export type TempOrderStatus =
  | "created"
  | "checkout_started"
  | "paid"
  | "finalizing"
  | "finalized"
  | "failed"
  | "expired";

export interface ITempOrder extends Document {
  user?: mongoose.Types.ObjectId;
  checkoutData: Record<string, any>;
  paymentProvider: "stripe";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  finalizedOrderId?: mongoose.Types.ObjectId;
  status: TempOrderStatus;
  lastError?: string;
  /** Legacy / display: temp checkout document cleanup; not used for Mongo TTL delete (see reservationExpiresAt). */
  expiresAt: Date;
  /** Wall-clock end of inventory hold (aligned with Stripe Checkout expires_at + buffer). */
  reservationExpiresAt?: Date;
  /** One-time guest view token returned on Stripe success (not stored on Order). */
  guestAccessToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TempOrderSchema = new Schema<ITempOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    checkoutData: { type: Schema.Types.Mixed, required: true },
    paymentProvider: { type: String, enum: ["stripe"], required: true, default: "stripe" },
    stripeSessionId: { type: String, index: true, sparse: true },
    stripePaymentIntentId: { type: String, index: true, sparse: true },
    finalizedOrderId: { type: Schema.Types.ObjectId, ref: "Order" },
    status: {
      type: String,
      enum: ["created", "checkout_started", "paid", "finalizing", "finalized", "failed", "expired"],
      default: "created",
      index: true,
    },
    lastError: { type: String },
    expiresAt: { type: Date, required: true, index: true },
    reservationExpiresAt: { type: Date, index: true, sparse: true },
    guestAccessToken: { type: String },
  },
  { timestamps: true }
);

const TempOrder: Model<ITempOrder> =
  mongoose.models.TempOrder || mongoose.model<ITempOrder>("TempOrder", TempOrderSchema);

export default TempOrder;

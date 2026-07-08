import mongoose, { Document, Model, Schema } from "mongoose";

export interface IOrderGuestAccessToken extends Document {
  order: mongoose.Types.ObjectId;
  email: string;
  tokenHash: string;
  expiresAt: Date;
  claimedByUser?: mongoose.Types.ObjectId;
  claimedAt?: Date;
}

const OrderGuestAccessTokenSchema = new Schema<IOrderGuestAccessToken>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    email: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true, index: true },
    claimedByUser: { type: Schema.Types.ObjectId, ref: "User" },
    claimedAt: { type: Date },
  },
  { timestamps: true }
);

const OrderGuestAccessToken: Model<IOrderGuestAccessToken> =
  mongoose.models.OrderGuestAccessToken ||
  mongoose.model<IOrderGuestAccessToken>("OrderGuestAccessToken", OrderGuestAccessTokenSchema);

export default OrderGuestAccessToken;

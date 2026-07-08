import mongoose, { Schema, Document, Model } from "mongoose";

export type StripeWebhookEventStatus = "processing" | "processed" | "error";

export interface IStripeWebhookEvent extends Document {
  stripeEventId: string;
  type: string;
  status: StripeWebhookEventStatus;
  processedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const StripeWebhookEventSchema = new Schema<IStripeWebhookEvent>(
  {
    stripeEventId: { type: String, required: true, unique: true, index: true },
    type: { type: String, required: true },
    status: {
      type: String,
      enum: ["processing", "processed", "error"],
      default: "processing",
      index: true,
    },
    processedAt: { type: Date },
    lastError: { type: String },
  },
  { timestamps: true }
);

const StripeWebhookEvent: Model<IStripeWebhookEvent> =
  mongoose.models.StripeWebhookEvent ||
  mongoose.model<IStripeWebhookEvent>("StripeWebhookEvent", StripeWebhookEventSchema);

export default StripeWebhookEvent;

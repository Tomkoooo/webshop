import mongoose, { Document, Model, Schema } from "mongoose";

export type NewsletterAudience = "all_users" | "customers";
export type NewsletterTopic = "general" | "discounts" | "coupons" | "new_products";
export type NewsletterStatus = "draft" | "sending" | "sent" | "failed";

export interface INewsletterCampaign extends Document {
  title: string;
  subject: string;
  bodyHtml: string;
  audience: NewsletterAudience;
  topic: NewsletterTopic;
  status: NewsletterStatus;
  sentAt?: Date;
  recipientsCount: number;
  successCount: number;
  failureCount: number;
  errorMessage?: string;
  createdBy?: mongoose.Types.ObjectId;
}

const NewsletterCampaignSchema = new Schema<INewsletterCampaign>(
  {
    title: { type: String, required: true },
    subject: { type: String, required: true },
    bodyHtml: { type: String, required: true },
    audience: { type: String, enum: ["all_users", "customers"], default: "all_users" },
    topic: {
      type: String,
      enum: ["general", "discounts", "coupons", "new_products"],
      default: "general",
    },
    status: { type: String, enum: ["draft", "sending", "sent", "failed"], default: "draft" },
    sentAt: { type: Date },
    recipientsCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    errorMessage: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const NewsletterCampaign: Model<INewsletterCampaign> =
  mongoose.models.NewsletterCampaign ||
  mongoose.model<INewsletterCampaign>("NewsletterCampaign", NewsletterCampaignSchema);

export default NewsletterCampaign;

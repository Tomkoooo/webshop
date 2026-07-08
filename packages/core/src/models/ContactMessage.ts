import mongoose, { Schema, Document, Model } from "mongoose";

export type ContactMessageStatus = "unread" | "read" | "replied" | "archived";
export type ContactNotificationStatus = "pending" | "sent" | "failed";
export type ContactReplyStatus = "pending" | "sent" | "failed";

export interface IContactReply {
  _id: mongoose.Types.ObjectId;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: ContactReplyStatus;
  error?: string;
  sentAt?: Date;
  createdAt: Date;
  adminUserId?: string;
  adminName?: string;
  adminEmail?: string;
}

export interface IContactMessage extends Document {
  name: string;
  email: string;
  message: string;
  recipientId?: string;
  recipientLabel: string;
  recipientEmail: string;
  status: ContactMessageStatus;
  notificationStatus: ContactNotificationStatus;
  notificationError?: string;
  notificationSentAt?: Date;
  replies: IContactReply[];
  lastRepliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContactReplySchema = new Schema<IContactReply>(
  {
    subject: { type: String, required: true, trim: true },
    bodyHtml: { type: String, required: true },
    bodyText: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      required: true,
    },
    error: { type: String },
    sentAt: { type: Date },
    createdAt: { type: Date, default: Date.now, required: true },
    adminUserId: { type: String },
    adminName: { type: String },
    adminEmail: { type: String },
  },
  { _id: true }
);

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true },
    recipientId: { type: String },
    recipientLabel: { type: String, required: true, trim: true },
    recipientEmail: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["unread", "read", "replied", "archived"],
      default: "unread",
      required: true,
      index: true,
    },
    notificationStatus: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      required: true,
      index: true,
    },
    notificationError: { type: String },
    notificationSentAt: { type: Date },
    replies: { type: [ContactReplySchema], default: [] },
    lastRepliedAt: { type: Date },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });
ContactMessageSchema.index({ email: 1 });
ContactMessageSchema.index({ recipientId: 1 });

const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

export default ContactMessage;

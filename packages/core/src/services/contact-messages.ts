import mongoose from "mongoose";
import dbConnect from "@wse/core/lib/db";
import ContactMessage, {
  type ContactMessageStatus,
  type ContactNotificationStatus,
  type ContactReplyStatus,
} from "@wse/core/models/ContactMessage";

export type ContactMessageListFilters = {
  q?: string;
  status?: string;
  recipientId?: string;
};

export type CreateContactMessageInput = {
  name: string;
  email: string;
  message: string;
  recipientId?: string;
  recipientLabel: string;
  recipientEmail: string;
};

export type CreateContactReplyInput = {
  subject: string;
  bodyHtml: string;
  bodyText: string;
  adminUserId?: string;
  adminName?: string;
  adminEmail?: string;
};

export type SerializedContactReply = {
  _id: string;
  subject: string;
  bodyHtml: string;
  bodyText: string;
  status: ContactReplyStatus;
  error?: string;
  sentAt?: string;
  createdAt: string;
  adminUserId?: string;
  adminName?: string;
  adminEmail?: string;
};

export type SerializedContactMessage = {
  _id: string;
  name: string;
  email: string;
  message: string;
  recipientId?: string;
  recipientLabel: string;
  recipientEmail: string;
  status: ContactMessageStatus;
  notificationStatus: ContactNotificationStatus;
  notificationError?: string;
  notificationSentAt?: string;
  replies: SerializedContactReply[];
  lastRepliedAt?: string;
  createdAt: string;
  updatedAt: string;
};

const CONTACT_STATUSES: ContactMessageStatus[] = ["unread", "read", "replied", "archived"];
const NOTIFICATION_STATUSES: ContactNotificationStatus[] = ["pending", "sent", "failed"];

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serialize<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isValidObjectId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export const ContactMessageService = {
  async create(input: CreateContactMessageInput) {
    await dbConnect();
    const message = await ContactMessage.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      message: input.message,
      recipientId: input.recipientId,
      recipientLabel: input.recipientLabel.trim(),
      recipientEmail: input.recipientEmail.trim().toLowerCase(),
      status: "unread",
      notificationStatus: "pending",
    });
    return serialize<SerializedContactMessage>(message);
  },

  async list(filters: ContactMessageListFilters = {}) {
    await dbConnect();
    const query: Record<string, unknown> = {};

    if (CONTACT_STATUSES.includes(filters.status as ContactMessageStatus)) {
      query.status = filters.status;
    }

    if (filters.recipientId && filters.recipientId !== "all") {
      query.recipientId = filters.recipientId;
    }

    const search = String(filters.q || "").trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), "i");
      query.$or = [
        { name: regex },
        { email: regex },
        { message: regex },
        { recipientLabel: regex },
        { recipientEmail: regex },
      ];
    }

    const messages = await ContactMessage.find(query).sort({ createdAt: -1 }).limit(250).lean();
    return serialize<SerializedContactMessage[]>(messages);
  },

  async getById(id: string) {
    if (!isValidObjectId(id)) return null;
    await dbConnect();
    const message = await ContactMessage.findById(id).lean();
    return message ? serialize<SerializedContactMessage>(message) : null;
  },

  async updateStatus(id: string, status: ContactMessageStatus) {
    if (!isValidObjectId(id) || !CONTACT_STATUSES.includes(status)) return null;
    await dbConnect();
    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: "after" }
    ).lean();
    return message ? serialize<SerializedContactMessage>(message) : null;
  },

  async updateNotificationStatus(
    id: string,
    status: ContactNotificationStatus,
    error?: string
  ) {
    if (!isValidObjectId(id) || !NOTIFICATION_STATUSES.includes(status)) return null;
    await dbConnect();

    const update =
      status === "sent"
        ? {
            $set: { notificationStatus: status, notificationSentAt: new Date() },
            $unset: { notificationError: "" },
          }
        : {
            $set: { notificationStatus: status, notificationError: error || "" },
            $unset: { notificationSentAt: "" },
          };

    const message = await ContactMessage.findByIdAndUpdate(id, update, {
      returnDocument: "after",
    }).lean();
    return message ? serialize<SerializedContactMessage>(message) : null;
  },

  async createReplyAttempt(id: string, input: CreateContactReplyInput) {
    if (!isValidObjectId(id)) return null;
    await dbConnect();

    const replyId = new mongoose.Types.ObjectId();
    const reply = {
      _id: replyId,
      subject: input.subject.trim(),
      bodyHtml: input.bodyHtml,
      bodyText: input.bodyText,
      status: "pending" as ContactReplyStatus,
      createdAt: new Date(),
      adminUserId: input.adminUserId,
      adminName: input.adminName,
      adminEmail: input.adminEmail,
    };

    const message = await ContactMessage.findByIdAndUpdate(
      id,
      { $push: { replies: reply } },
      { returnDocument: "after" }
    ).lean();

    if (!message) return null;
    return { replyId: replyId.toString(), message: serialize<SerializedContactMessage>(message) };
  },

  async updateReplyStatus(
    messageId: string,
    replyId: string,
    status: Exclude<ContactReplyStatus, "pending">,
    error?: string
  ) {
    if (!isValidObjectId(messageId) || !isValidObjectId(replyId)) return null;
    await dbConnect();

    const update =
      status === "sent"
        ? {
            $set: {
              "replies.$.status": "sent",
              "replies.$.sentAt": new Date(),
              status: "replied",
              lastRepliedAt: new Date(),
            },
            $unset: { "replies.$.error": "" },
          }
        : {
            $set: { "replies.$.status": "failed", "replies.$.error": error || "" },
            $unset: { "replies.$.sentAt": "" },
          };

    await ContactMessage.updateOne({ _id: messageId, "replies._id": replyId }, update);
    return this.getById(messageId);
  },
};

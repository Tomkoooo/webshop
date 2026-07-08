"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@wse/core/lib/admin-auth"
import { contactReplyHtmlToText } from "@wse/core/lib/contact-replies"
import { serializeMailerError } from "@wse/core/lib/mailer-log"
import { MailerService } from "@wse/core/services/mailer"
import {
  ContactMessageService,
  type ContactMessageListFilters,
} from "@wse/core/services/contact-messages"
import type { ContactMessageStatus } from "@wse/core/models/ContactMessage"

export type ContactReplyFormState = {
  ok: boolean
  message: string
}

const CONTACT_STATUSES: ContactMessageStatus[] = ["unread", "read", "replied", "archived"]

export async function getContactMessages(filters: ContactMessageListFilters = {}) {
  await requireAdmin()
  return ContactMessageService.list(filters)
}

export async function getContactMessage(id: string) {
  await requireAdmin()
  const message = await ContactMessageService.getById(id)
  if (message?.status === "unread") {
    const updated = await ContactMessageService.updateStatus(id, "read")
    return updated || message
  }
  return message
}

export async function updateContactMessageStatus(id: string, status: ContactMessageStatus) {
  await requireAdmin()
  if (!CONTACT_STATUSES.includes(status)) {
    throw new Error("Érvénytelen státusz.")
  }

  await ContactMessageService.updateStatus(id, status)
  revalidateContactMessagePaths(id)
}

export async function sendContactReply(
  messageId: string,
  _prevState: ContactReplyFormState | undefined,
  formData: FormData
): Promise<ContactReplyFormState> {
  const session = await requireAdmin()
  const message = await ContactMessageService.getById(messageId)

  if (!message) {
    return { ok: false, message: "Az üzenet nem található." }
  }

  const subject = String(formData.get("subject") || "").trim()
  const bodyHtml = String(formData.get("bodyHtml") || "").trim()
  const bodyText = contactReplyHtmlToText(bodyHtml)

  if (!subject || !bodyText) {
    return { ok: false, message: "Tárgy és üzenet megadása kötelező." }
  }

  const adminUser = session.user as {
    id?: string
    name?: string | null
    email?: string | null
  }

  const attempt = await ContactMessageService.createReplyAttempt(messageId, {
    subject,
    bodyHtml,
    bodyText,
    adminUserId: adminUser.id,
    adminName: adminUser.name || undefined,
    adminEmail: adminUser.email || undefined,
  })

  if (!attempt) {
    return { ok: false, message: "A válasz mentése sikertelen." }
  }

  try {
    await MailerService.sendEmail({
      to: message.email,
      templateType: "contact_reply",
      data: {
        subject,
        bodyHtml,
        bodyText,
        originalName: message.name,
        originalEmail: message.email,
        originalMessage: message.message,
        originalMessageHtml: escapeHtml(message.message).replace(/\n/g, "<br />"),
        originalCreatedAt: message.createdAt,
        adminName: adminUser.name || "",
        adminEmail: adminUser.email || "",
      },
      logContext: {
        flow: "contact_reply",
        contactMessageId: messageId,
        contactReplyId: attempt.replyId,
      },
    })
    await ContactMessageService.updateReplyStatus(messageId, attempt.replyId, "sent")
    revalidateContactMessagePaths(messageId)
    return { ok: true, message: "Válasz elküldve." }
  } catch (error) {
    await ContactMessageService.updateReplyStatus(
      messageId,
      attempt.replyId,
      "failed",
      formatStoredMailerError(error)
    )
    revalidateContactMessagePaths(messageId)
    return {
      ok: false,
      message: "A válasz mentve lett, de az email küldése sikertelen.",
    }
  }
}

function revalidateContactMessagePaths(id: string) {
  revalidatePath("/admin")
  revalidatePath("/admin/contact")
  revalidatePath(`/admin/contact/${id}`)
}

function formatStoredMailerError(error: unknown): string {
  return JSON.stringify(serializeMailerError(error)).slice(0, 2000)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

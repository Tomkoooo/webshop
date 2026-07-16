import { logMailer } from "@wse/core/lib/mailer-log"
import { sendOrgTemplatedEmail } from "./org-integrations"

export type SendVoucherEmailInput = {
  to: string
  recipientName: string
  eventName: string
  bookingId: string
  voucherCount: number
  guests: number
  pdfBuffer: Buffer
  pdfFilename: string
  organizationId?: string | null
  logContext?: Record<string, unknown>
}

export async function sendVoucherEmail(input: SendVoucherEmailInput) {
  const bookingId = input.bookingId
  try {
    await sendOrgTemplatedEmail({
      organizationId: input.organizationId ?? null,
      to: input.to,
      templateType: "t_book_voucher_delivery",
      data: {
        customerName: input.recipientName,
        customerEmail: input.to,
        eventName: input.eventName,
        guests: input.guests,
        voucherCount: input.voucherCount,
        bookingId,
      },
      attachments: [
        {
          filename: input.pdfFilename,
          content: input.pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    })
  } catch (error) {
    logMailer("error", "t_book_voucher_delivery_failed", {
      bookingId,
      to: input.to,
      error: error instanceof Error ? error.message : String(error),
      ...input.logContext,
    })
    throw error
  }
}

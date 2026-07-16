import { logMailer } from "@wse/core/lib/mailer-log"
import { EmailTemplateService } from "@wse/core/services/email-template"
import type { ITBookBooking } from "../models/TBookBooking"
import { formatTBookMoney } from "./currency"
import { buildTBookEmailTemplateSeeds } from "./email-templates"
import { sendOrgTemplatedEmail } from "./org-integrations"

async function ensureInvoiceEmailTemplate() {
  const existing = await EmailTemplateService.getByType("t_book_invoice_sent")
  if (existing) return
  const seed = buildTBookEmailTemplateSeeds("tBook").find((t) => t.type === "t_book_invoice_sent")
  if (seed) await EmailTemplateService.createMissing(seed.type, seed)
}

export async function sendBookingInvoiceEmail(
  booking: Pick<
    ITBookBooking,
    | "_id"
    | "customer"
    | "eventName"
    | "guests"
    | "totalHuf"
    | "currency"
    | "organizationId"
    | "invoiceId"
    | "invoicePdfFileName"
  >
): Promise<boolean> {
  const bookingId = String(booking._id)
  const to = booking.customer?.email?.trim()
  if (!to) {
    logMailer("warn", "t_book_invoice_sent_skipped", {
      bookingId,
      reason: "no_customer_email",
    })
    return false
  }

  try {
    await ensureInvoiceEmailTemplate()
    const { downloadBookingInvoicePdf } = await import("../services/invoice-service")
    const pdf = await downloadBookingInvoicePdf(
      bookingId,
      booking.organizationId ? String(booking.organizationId) : undefined
    )
    if (!pdf) {
      logMailer("warn", "t_book_invoice_sent_skipped", {
        bookingId,
        reason: "pdf_unavailable",
      })
      return false
    }

    const currency = booking.currency || "HUF"
    const totalFormatted = formatTBookMoney(booking.totalHuf, currency)
    const filename = `${booking.invoiceId || `invoice-${bookingId}`}.pdf`

    await sendOrgTemplatedEmail({
      organizationId: booking.organizationId ? String(booking.organizationId) : null,
      to,
      templateType: "t_book_invoice_sent",
      data: {
        customerName: booking.customer.name,
        customerEmail: to,
        eventName: booking.eventName,
        guests: booking.guests,
        total: totalFormatted,
        totalHuf: totalFormatted,
        currency,
        bookingId,
        invoiceId: booking.invoiceId || "",
      },
      attachments: [
        {
          filename,
          content: pdf,
          contentType: "application/pdf",
        },
      ],
    })
    return true
  } catch (error) {
    logMailer("error", "t_book_invoice_sent_failed", {
      bookingId,
      to,
      error: error instanceof Error ? error.message : String(error),
    })
    return false
  }
}

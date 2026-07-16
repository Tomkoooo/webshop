import { logMailer } from "@wse/core/lib/mailer-log"
import type { ITBookBooking } from "../models/TBookBooking"
import { formatTBookMoney } from "./currency"
import { sendOrgTemplatedEmail } from "./org-integrations"

export async function sendBookingConfirmationEmail(
  booking: Pick<
    ITBookBooking,
    | "_id"
    | "customer"
    | "eventName"
    | "hotelName"
    | "guests"
    | "nights"
    | "totalHuf"
    | "currency"
    | "organizationId"
  >
) {
  const bookingId = String(booking._id)
  const currency = booking.currency || "HUF"
  const totalFormatted = formatTBookMoney(booking.totalHuf, currency)
  try {
    await sendOrgTemplatedEmail({
      organizationId: booking.organizationId ? String(booking.organizationId) : null,
      to: booking.customer.email,
      templateType: "t_book_booking_confirmation",
      data: {
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        eventName: booking.eventName,
        hotelName: booking.hotelName || "—",
        guests: booking.guests,
        nights: booking.nights || 0,
        totalHuf: totalFormatted,
        total: totalFormatted,
        currency,
        bookingId,
      },
    })
  } catch (error) {
    logMailer("error", "t_book_booking_confirmation_failed", {
      bookingId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

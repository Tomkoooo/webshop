import { logMailer } from "@wse/core/lib/mailer-log"
import { MailerService } from "@wse/core/services/mailer"
import type { ITBookBooking } from "../models/TBookBooking"

export async function sendBookingConfirmationEmail(
  booking: Pick<
    ITBookBooking,
    "_id" | "customer" | "eventName" | "hotelName" | "guests" | "nights" | "totalHuf"
  >
) {
  const bookingId = String(booking._id)
  try {
    await MailerService.sendEmail({
      to: booking.customer.email,
      templateType: "t_book_booking_confirmation",
      data: {
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        eventName: booking.eventName,
        hotelName: booking.hotelName || "—",
        guests: booking.guests,
        nights: booking.nights || 0,
        totalHuf: booking.totalHuf.toLocaleString("hu-HU"),
        bookingId,
      },
      logContext: {
        flow: "t_book_booking_confirmation",
        bookingId,
        pluginId: "t-book",
      },
    })
  } catch (error) {
    logMailer("error", "t_book_booking_confirmation_failed", {
      bookingId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

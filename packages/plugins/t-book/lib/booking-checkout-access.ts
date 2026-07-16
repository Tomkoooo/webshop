import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import TBookBooking, { type ITBookBooking } from "../models/TBookBooking"

/** Guest checkout access: booking id + Stripe session id from the success redirect. */
export async function loadBookingForGuestCheckout(
  bookingId: string,
  stripeSessionId: string | null | undefined
): Promise<ITBookBooking> {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw Object.assign(new Error("Érvénytelen foglalás."), { statusCode: 400 })
  }
  if (!stripeSessionId?.trim()) {
    throw Object.assign(new Error("Hiányzó Stripe munkamenet."), { statusCode: 400 })
  }

  await dbConnect()
  const booking = await TBookBooking.findById(bookingId).lean<ITBookBooking>()
  if (!booking) {
    throw Object.assign(new Error("Foglalás nem található."), { statusCode: 404 })
  }
  if (booking.stripeSessionId && booking.stripeSessionId !== stripeSessionId) {
    throw Object.assign(new Error("Session mismatch"), { statusCode: 403 })
  }
  return booking
}

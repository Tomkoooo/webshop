import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import { getAppBaseUrl, getStripeClient } from "@wse/core/services/stripe"
import {
  clampReservationTtlMs,
  reservationEndsAt,
  stripeCheckoutExpiresAtUnix,
} from "@wse/core/services/reservation-ttl"
import TBookBooking from "../models/TBookBooking"
import { normalizeTBookCurrency, stripeCurrencyCode, toStripeUnitAmount } from "../lib/currency"
import { TBookBookingService } from "./booking-service"
import type { CreateBookingInput } from "../lib/schemas"

export const TBOOK_CHECKOUT_KIND = "t_book"

async function resolveCheckoutCurrency(booking: { currency?: string | null }) {
  return normalizeTBookCurrency(booking.currency)
}

export class TBookCheckoutService {
  static async assertStripeEnabled() {
    const enabled = await FeatureFlagService.isEnabled("stripePayments", false)
    if (!enabled) throw new Error("A Stripe fizetés jelenleg nem elérhető.")
  }

  /**
   * Full public booking flow: validate + price server-side, persist a pending
   * booking, then return a Stripe Checkout URL. Secrets never leave the server.
   */
  static async createBookingWithCheckout(
    input: CreateBookingInput,
    opts?: { groupId?: mongoose.Types.ObjectId; returnBaseUrl?: string }
  ) {
    await TBookCheckoutService.assertStripeEnabled()

    const booking = await TBookBookingService.createPendingBooking(input, {
      groupId: opts?.groupId,
    })

    const now = new Date()
    const ttlMs = clampReservationTtlMs(null)
    const expiresAt = reservationEndsAt(now, ttlMs)

    const stripe = getStripeClient()
    const storefrontBase =
      booking.checkoutReturnBaseUrl?.trim() ||
      input.returnBaseUrl?.trim() ||
      opts?.returnBaseUrl?.trim() ||
      getAppBaseUrl()
    const bookingId = booking._id.toString()
    const currency = await resolveCheckoutCurrency(booking)
    const returnTo = encodeURIComponent(storefrontBase)

    const description = [
      `${booking.guests} fő`,
      booking.hotelName ? `${booking.hotelName}, ${booking.nights} éj` : "csak jegy",
    ].join(" · ")

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${storefrontBase}/foglalas/siker?bookingId=${bookingId}&session_id={CHECKOUT_SESSION_ID}&return_to=${returnTo}`,
      cancel_url: `${storefrontBase}/foglalas/siker?bookingId=${bookingId}&cancelled=1&return_to=${returnTo}`,
      client_reference_id: bookingId,
      metadata: {
        tBookBookingId: bookingId,
        checkoutKind: TBOOK_CHECKOUT_KIND,
      },
      payment_intent_data: {
        metadata: {
          tBookBookingId: bookingId,
          checkoutKind: TBOOK_CHECKOUT_KIND,
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: stripeCurrencyCode(currency),
            unit_amount: toStripeUnitAmount(booking.totalHuf, currency),
            product_data: {
              name: booking.eventName,
              description,
            },
          },
        },
      ],
      payment_method_types: ["card"],
      locale: "hu",
      expires_at: stripeCheckoutExpiresAtUnix(now, expiresAt),
      customer_email: booking.customer.email,
    })

    booking.status = "checkout_started"
    booking.stripeSessionId = checkoutSession.id
    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id
    if (paymentIntentId) booking.stripePaymentIntentId = paymentIntentId
    booking.expiresAt = expiresAt
    await booking.save()

    return {
      bookingId,
      totalHuf: booking.totalHuf,
      quote: booking.quote,
      checkoutUrl: checkoutSession.url,
      stripeSessionId: checkoutSession.id,
      expiresAt: expiresAt.toISOString(),
    }
  }

  static async getCheckoutStatus(bookingId: string, stripeSessionId?: string | null) {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      throw new Error("Érvénytelen foglalás.")
    }
    await dbConnect()
    const booking = await TBookBooking.findById(bookingId).lean()
    if (!booking) throw new Error("Foglalás nem található.")

    if (stripeSessionId && booking.stripeSessionId && stripeSessionId !== booking.stripeSessionId) {
      throw new Error("Session mismatch")
    }

    // Success-redirect fallback in case the webhook is delayed.
    if (
      stripeSessionId &&
      booking.status !== "paid" &&
      booking.status !== "confirmed"
    ) {
      const stripe = getStripeClient()
      const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId)
      if (checkoutSession.payment_status === "paid") {
        await TBookCheckoutService.finalizeBookingFromStripeSession(checkoutSession)
      }
    }

    const latest = await TBookBooking.findById(bookingId).lean()
    const resolved = latest ?? booking
    const paid = resolved.status === "paid" || resolved.status === "confirmed"

    let vouchersReady = false
    if (paid) {
      const TBookVoucher = (await import("../models/TBookVoucher")).default
      vouchersReady =
        (await TBookVoucher.countDocuments({
          bookingId: resolved._id,
          pdfFileName: { $exists: true, $ne: null },
        })) > 0
    }

    return {
      status: resolved.status,
      invoiceStatus: resolved.invoiceStatus ?? "none",
      invoiceReady: resolved.invoiceStatus === "issued",
      invoiceError: resolved.invoiceError ?? null,
      vouchersReady,
      eventName: resolved.eventName,
      totalHuf: resolved.totalHuf,
      guests: resolved.guests,
      returnBaseUrl: resolved.checkoutReturnBaseUrl ?? null,
    }
  }

  static async downloadInvoiceForGuestCheckout(
    bookingId: string,
    stripeSessionId: string | null | undefined
  ): Promise<Buffer | null> {
    const { loadBookingForGuestCheckout } = await import("../lib/booking-checkout-access")
    const booking = await loadBookingForGuestCheckout(bookingId, stripeSessionId)
    if (booking.invoiceStatus !== "issued") return null
    const { downloadBookingInvoicePdf } = await import("./invoice-service")
    return downloadBookingInvoicePdf(bookingId)
  }

  static async downloadVouchersForGuestCheckout(
    bookingId: string,
    stripeSessionId: string | null | undefined
  ): Promise<Buffer | null> {
    const { loadBookingForGuestCheckout } = await import("../lib/booking-checkout-access")
    await loadBookingForGuestCheckout(bookingId, stripeSessionId)
    const { getVoucherPdfForBooking } = await import("./voucher-service")
    return getVoucherPdfForBooking(bookingId)
  }

  /** Idempotent webhook finalization: mark paid, issue invoice, send email. */
  static async finalizeBookingFromStripeSession(checkoutSession: {
    id: string
    payment_status?: string | null
    metadata?: { tBookBookingId?: string } | null
    client_reference_id?: string | null
  }) {
    if (checkoutSession.payment_status !== "paid") return null

    const bookingId =
      checkoutSession.metadata?.tBookBookingId || checkoutSession.client_reference_id
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) return null

    await dbConnect()
    // Atomic claim so webhook + success-redirect fallback can't double-finalize.
    const booking = await TBookBooking.findOneAndUpdate(
      {
        _id: bookingId,
        stripeSessionId: checkoutSession.id,
        status: { $in: ["pending", "checkout_started"] },
      },
      { $set: { status: "paid", paidAt: new Date() } },
      { new: true }
    )
    if (!booking) return null

    const { sendBookingConfirmationEmail } = await import("../lib/send-booking-email")
    await sendBookingConfirmationEmail(booking)

    const { issueVouchersForBooking } = await import("./voucher-service")
    try {
      await issueVouchersForBooking(booking._id.toString())
    } catch (error) {
      console.error("[t-book] voucher issue failed", booking._id.toString(), error)
    }

    const { issueBookingInvoice } = await import("./invoice-service")
    void issueBookingInvoice(booking._id.toString())

    return booking._id.toString()
  }

  static async expireBooking(bookingId: string) {
    if (!mongoose.Types.ObjectId.isValid(bookingId)) return
    await dbConnect()
    await TBookBooking.updateOne(
      { _id: bookingId, status: { $in: ["pending", "checkout_started"] } },
      { $set: { status: "expired" } }
    )
  }
}

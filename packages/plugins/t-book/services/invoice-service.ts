import dbConnect from "@wse/core/lib/db"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import { InvoicingSzamlazzService } from "@wse/core/services/invoicing-szamlazz"
import type { IOrder } from "@wse/core/models/Order"
import TBookBooking, { type ITBookBooking } from "../models/TBookBooking"
import TBookEvent from "../models/TBookEvent"
import TBookHotel from "../models/TBookHotel"
import { normalizeTBookCurrency } from "../lib/currency"

function parseVatPercentFallback(): number {
  const n = Number(process.env.TBOOK_INVOICE_VAT_PERCENT ?? 27)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : 27
}

function vatForQuoteLine(
  lineKey: string,
  ticketVatPercent: number,
  accommodationVatPercent: number
): number {
  if (
    lineKey === "accommodation_base" ||
    lineKey.startsWith("package") ||
    lineKey.startsWith("package_unit:") ||
    lineKey.startsWith("option:")
  ) {
    return accommodationVatPercent
  }
  // ticket, pricing_rule:*, adjust_total-style lines → ticket VAT
  return ticketVatPercent
}

/**
 * Adapts a tBook booking to the `IOrder` shape consumed by the core
 * szamlazz.hu service. Line VAT comes from the event ticket VAT and hotel VAT
 * (not a global org VAT setting).
 */
export function bookingToInvoiceOrder(
  booking: ITBookBooking,
  vat: { ticketVatPercent: number; accommodationVatPercent: number }
): IOrder {
  const billing = booking.billing ?? {
    name: booking.customer.name,
    zip: "",
    city: "",
    street: "",
    countryCode: "HU",
    taxNumber: "",
  }

  const items = booking.quote.lines
    .filter((line) => line.amountHuf > 0)
    .map((line) => ({
      name: line.label,
      quantity: 1,
      price: line.amountHuf,
      vatPercent: vatForQuoteLine(line.key, vat.ticketVatPercent, vat.accommodationVatPercent),
    }))

  return {
    _id: booking._id,
    items,
    shippingFee: 0,
    paymentFee: 0,
    billingInfo: {
      name: billing.name,
      zip: billing.zip,
      city: billing.city,
      street: billing.street,
      countryCode: billing.countryCode || "HU",
      taxNumber: billing.taxNumber || "",
      phone: booking.customer.phone,
    },
    paymentMethod: { name: "Stripe kártyás fizetés" },
  } as unknown as IOrder
}

function assertBookingOrg(booking: ITBookBooking | null, organizationId?: string) {
  if (!booking) throw new Error("Foglalás nem található.")
  if (organizationId && booking.organizationId && String(booking.organizationId) !== organizationId) {
    throw new Error("A foglalás nem tartozik ehhez a szervezethez.")
  }
}

async function resolveBookingVatPercents(booking: ITBookBooking): Promise<{
  ticketVatPercent: number
  accommodationVatPercent: number
}> {
  const fallback = parseVatPercentFallback()
  const event = await TBookEvent.findById(booking.eventId).select("ticketVatPercent").lean()
  const ticketVatPercent =
    typeof event?.ticketVatPercent === "number" ? event.ticketVatPercent : fallback

  let accommodationVatPercent = ticketVatPercent
  if (booking.hotelId) {
    const hotel = await TBookHotel.findById(booking.hotelId).select("pricing.vatPercent").lean()
    const hotelVat = hotel?.pricing?.vatPercent
    if (typeof hotelVat === "number") accommodationVatPercent = hotelVat
  }

  return { ticketVatPercent, accommodationVatPercent }
}

async function deliverInvoiceEmailIfNeeded(booking: ITBookBooking): Promise<void> {
  if (booking.invoiceStatus !== "issued" || booking.invoiceEmailSentAt) return
  const { sendBookingInvoiceEmail } = await import("../lib/send-invoice-email")
  const sent = await sendBookingInvoiceEmail(booking)
  if (sent) {
    booking.invoiceEmailSentAt = new Date()
    await booking.save()
  }
}

/** Fire-and-forget after payment; failures are recorded for admin retry. */
export async function issueBookingInvoice(bookingId: string, organizationId?: string): Promise<void> {
  await dbConnect()
  const booking = await TBookBooking.findById(bookingId)
  assertBookingOrg(booking, organizationId)
  if (!booking) return

  if (booking.invoiceStatus === "issued") {
    await deliverInvoiceEmailIfNeeded(booking)
    return
  }

  const { resolveOrgSzamlazz } = await import("../lib/org-integrations")
  const orgSzamlazz = await resolveOrgSzamlazz(
    booking.organizationId ? String(booking.organizationId) : organizationId
  )
  const platformEnabled = await FeatureFlagService.isEnabled("szamlazzInvoicing", false)
  if (!orgSzamlazz && !platformEnabled) {
    // Finalize may have flipped status to pending — clear it so the success page stops waiting.
    // Common on test purchases when Számlázz.hu is not enabled for the org (and platform flag is off).
    if (booking.invoiceStatus === "pending" || booking.invoiceStatus === "none" || !booking.invoiceStatus) {
      booking.invoiceStatus = "none"
      booking.invoiceError =
        "Invoicing is not configured — enable Számlázz.hu in tBook org settings (or the platform szamlazzInvoicing flag)."
      await booking.save()
    }
    console.warn(
      "[t-book] invoice skipped (Számlázz not configured)",
      bookingId,
      "orgId=",
      booking.organizationId ? String(booking.organizationId) : null
    )
    return
  }

  booking.invoiceStatus = "pending"
  booking.invoiceError = null
  await booking.save()

  if (!booking.billing) {
    booking.invoiceStatus = "failed"
    booking.invoiceError = "Hiányzó számlázási cím — számla nem állítható ki."
    await booking.save()
    return
  }

  const bookingCurrency = normalizeTBookCurrency(booking.currency)
  if (bookingCurrency !== "HUF" && bookingCurrency !== "EUR") {
    booking.invoiceStatus = "failed"
    booking.invoiceError = `A szamlazz.hu integráció jelenleg csak HUF és EUR devizát támogat (foglalás: ${bookingCurrency}).`
    await booking.save()
    return
  }

  try {
    const vat = await resolveBookingVatPercents(booking)
    const result = await InvoicingSzamlazzService.issueInvoice(bookingToInvoiceOrder(booking, vat), {
      currency: bookingCurrency,
      credentials: orgSzamlazz
        ? {
            agentKey: orgSzamlazz.agentKey,
            sellerName: orgSzamlazz.sellerName,
            // Card payments — bank transfer seller fields are unused.
            sellerBank: "",
            sellerBankAccount: "",
          }
        : undefined,
    })
    booking.invoiceStatus = "issued"
    booking.invoiceId = result.invoiceId
    booking.invoicePdfFileName = result.pdfFileName ?? null
    booking.invoiceError = null
    await booking.save()
    await deliverInvoiceEmailIfNeeded(booking)
  } catch (error) {
    booking.invoiceStatus = "failed"
    booking.invoiceError = error instanceof Error ? error.message : String(error)
    console.error("[t-book] invoice issue failed", bookingId, error)
    await booking.save()
  }
}

export async function reverseBookingInvoice(bookingId: string, organizationId?: string): Promise<void> {
  await dbConnect()
  const booking = await TBookBooking.findById(bookingId)
  assertBookingOrg(booking, organizationId)
  if (!booking?.invoiceId || booking.invoiceStatus !== "issued") {
    throw new Error("Nincs kiállított számla ehhez a foglaláshoz.")
  }
  await InvoicingSzamlazzService.reverseInvoice(booking.invoiceId)
  booking.invoiceStatus = "reversed"
  await booking.save()
}

export async function downloadBookingInvoicePdf(
  bookingId: string,
  organizationId?: string
): Promise<Buffer | null> {
  await dbConnect()
  const booking = await TBookBooking.findById(bookingId).lean()
  assertBookingOrg(booking as ITBookBooking | null, organizationId)
  if (!booking?.invoiceId) return null
  return InvoicingSzamlazzService.downloadInvoicePdf({
    invoiceId: booking.invoiceId,
    legacyOrderNumber: String(booking._id),
    fallbackFileName: booking.invoicePdfFileName ?? undefined,
  })
}

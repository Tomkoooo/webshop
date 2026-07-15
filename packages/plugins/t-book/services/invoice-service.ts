import dbConnect from "@wse/core/lib/db"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import { InvoicingSzamlazzService } from "@wse/core/services/invoicing-szamlazz"
import type { IOrder } from "@wse/core/models/Order"
import TBookBooking, { type ITBookBooking } from "../models/TBookBooking"
import { normalizeTBookCurrency } from "../lib/currency"

function parseVatPercent(): number {
  const n = Number(process.env.TBOOK_INVOICE_VAT_PERCENT ?? 27)
  return Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : 27
}

/**
 * Adapts a tBook booking to the `IOrder` shape consumed by the core
 * szamlazz.hu service, so invoice issuing/download/reversal reuse one
 * integration. Invoice lines mirror the price breakdown (ticket, base rate,
 * option add-ons); negative/zero lines are folded into the total.
 */
export function bookingToInvoiceOrder(booking: ITBookBooking): IOrder {
  const vatPercent = parseVatPercent()
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
      vatPercent,
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

/** Fire-and-forget after payment; failures are recorded for admin retry. */
export async function issueBookingInvoice(bookingId: string, organizationId?: string): Promise<void> {
  await dbConnect()
  const booking = await TBookBooking.findById(bookingId)
  assertBookingOrg(booking, organizationId)
  if (!booking) return
  if (booking.invoiceStatus === "issued") return

  const invoicingEnabled = await FeatureFlagService.isEnabled("szamlazzInvoicing", false)
  if (!invoicingEnabled) return

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
    const result = await InvoicingSzamlazzService.issueInvoice(bookingToInvoiceOrder(booking), {
      currency: bookingCurrency,
    })
    booking.invoiceStatus = "issued"
    booking.invoiceId = result.invoiceId
    booking.invoicePdfFileName = result.pdfFileName ?? null
    booking.invoiceError = null
  } catch (error) {
    booking.invoiceStatus = "failed"
    booking.invoiceError = error instanceof Error ? error.message : String(error)
    console.error("[t-book] invoice issue failed", bookingId, error)
  }
  await booking.save()
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
  assertBookingOrg(booking, organizationId)
  if (!booking?.invoiceId) return null
  return InvoicingSzamlazzService.downloadInvoicePdf({
    invoiceId: booking.invoiceId,
    legacyOrderNumber: String(booking._id),
    fallbackFileName: booking.invoicePdfFileName ?? undefined,
  })
}

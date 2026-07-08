import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import { getAppBaseUrl, getStripeClient } from "@wse/core/services/stripe"
import { clampReservationTtlMs, reservationEndsAt, stripeCheckoutExpiresAtUnix } from "@wse/core/services/reservation-ttl"
import CampCheckoutHold from "../models/CampCheckoutHold"
import CampRegistration from "../models/CampRegistration"
import CampSession from "../models/CampSession"
import CampTicketType from "../models/CampTicketType"
import Camp from "../models/Camp"
import { createHoldSchema, type CreateHoldInput } from "../lib/schemas"
import { buildAddonSelections } from "../lib/checkout-addons"
import { calculateAddonTotalHuf, calculateCampOrderTotal, isAddonTicketType } from "../lib/pricing"
import { formatSessionLabel } from "../lib/session-label"
import { CampService } from "./camp-service"

function toStripeHufAmount(amount: number): number {
  return Math.max(1, Math.round(Number(amount || 0) * 100))
}

export class CampCheckoutService {
  static async assertStripeEnabled() {
    const stripeEnabled = await FeatureFlagService.isEnabled("stripePayments", false)
    if (!stripeEnabled) {
      throw new Error("A Stripe fizetés jelenleg nem elérhető.")
    }
  }

  static async createHold(input: CreateHoldInput) {
    const parsed = createHoldSchema.parse(input)
    if (parsed.children.length !== parsed.childCount) {
      throw new Error("A gyerekek száma nem egyezik a megadott darabszámmal.")
    }

    await dbConnect()
    const sessionOid = new mongoose.Types.ObjectId(parsed.sessionId)
    const ticketOid = new mongoose.Types.ObjectId(parsed.ticketTypeId)

    const session = await CampSession.findOne({ _id: sessionOid, isPublished: true }).lean()
    if (!session) throw new Error("A turnus nem található vagy nem elérhető.")

    const camp = await Camp.findOne({ _id: session.campId, isPublished: true }).lean()
    if (!camp) throw new Error("A tábor nem elérhető.")

    const sessionTickets = await CampTicketType.find({ sessionId: sessionOid, isActive: true }).lean()

    const ticketType = sessionTickets.find((t) => String(t._id) === String(ticketOid))
    if (!ticketType) throw new Error("A jegytípus nem található.")
    if (isAddonTicketType({ kind: ticketType.kind, name: ticketType.name })) {
      throw new Error("A kiegészítő jegy külön választható — válassz táborjegyet.")
    }

    const laptopTicket = sessionTickets.find((t) =>
      isAddonTicketType({ kind: t.kind, name: t.name })
    )
    const laptopTicketId = laptopTicket ? String(laptopTicket._id) : null

    const addonCounts = buildAddonSelections(
      parsed.children,
      sessionTickets,
      laptopTicketId
    )

    const addonLines: Array<{ ticket: (typeof sessionTickets)[0]; quantity: number }> = []
    for (const [addonId, quantity] of addonCounts) {
      const addonTicket = sessionTickets.find((t) => String(t._id) === addonId)
      if (!addonTicket) continue
      addonLines.push({ ticket: addonTicket, quantity })
    }

    const order = calculateCampOrderTotal({
      ticket: {
        name: ticketType.name,
        priceHuf: ticketType.priceHuf,
        pricingMode: ticketType.pricingMode,
        kind: ticketType.kind,
        earlyBirdEndsAt: ticketType.earlyBirdEndsAt,
        earlyBirdPriceHuf: ticketType.earlyBirdPriceHuf,
        earlyBirdDiscountPercent: ticketType.earlyBirdDiscountPercent,
      },
      childCount: parsed.childCount,
      children: parsed.children,
      campSettings: camp.pricingSettings,
      addons: addonLines.map(({ ticket, quantity }) => ({ ticket, quantity })),
    })

    const laptopAddonCount = laptopTicketId ? addonCounts.get(laptopTicketId) ?? 0 : 0
    const laptopAddonHuf =
      laptopTicket && laptopAddonCount > 0
        ? calculateAddonTotalHuf([{ ticket: laptopTicket, quantity: laptopAddonCount }])
        : 0

    const seats = CampService.seatsRequired(parsed.childCount)
    const sessionLabel = formatSessionLabel(session.label, session.startDate, session.endDate)
    const now = new Date()
    const ttlMs = clampReservationTtlMs(null)
    const expiresAt = reservationEndsAt(now, ttlMs)

    await CampService.reserveSessionSeats(sessionOid, seats)

    try {
      const hold = await CampCheckoutHold.create({
        sessionId: sessionOid,
        ticketTypeId: ticketOid,
        campId: session.campId,
        childCount: parsed.childCount,
        buyerName: parsed.buyerName.trim(),
        buyerEmail: parsed.buyerEmail.trim().toLowerCase(),
        buyerPhone: parsed.buyerPhone.trim(),
        children: parsed.children.map((c) => ({
          name: c.name.trim(),
          lastName: c.lastName?.trim() || "",
          birthDate: c.birthDate.trim(),
          diningOption: c.diningOption || "Normál",
          dietaryRequest: c.dietaryRequest?.trim() || "",
          allergies: c.allergies?.trim() || "",
          laptopRental: Boolean(c.laptopRental),
          addonTicketIds: c.addonTicketIds ?? [],
        })),
        ticketTypeName: ticketType.name,
        sessionLabel,
        pricingMode: ticketType.pricingMode,
        totalHuf: order.totalHuf,
        laptopAddonHuf,
        laptopAddonCount,
        priceBreakdown: {
          campSubtotalHuf: order.campSubtotalHuf,
          earlyBirdSavingsHuf: order.earlyBirdSavingsHuf,
          familyDiscountHuf: order.familyDiscountHuf,
          addonsHuf: order.addonsHuf,
          familyDiscountPercent: order.familyDiscountPercent,
          lines: order.lines,
        },
        status: "created",
        expiresAt,
      })

      return {
        holdId: hold._id.toString(),
        totalHuf: order.totalHuf,
        laptopAddonHuf,
        priceBreakdown: order,
        expiresAt: hold.expiresAt.toISOString(),
        sessionLabel,
        ticketTypeName: ticketType.name,
      }
    } catch (err) {
      await CampService.releaseSessionSeats(sessionOid, seats)
      throw err
    }
  }

  static async createStripeSession(holdId: string) {
    await CampCheckoutService.assertStripeEnabled()
    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      throw new Error("Érvénytelen foglalás.")
    }

    await dbConnect()
    const hold = await CampCheckoutHold.findById(holdId)
    if (!hold || hold.status === "expired" || hold.status === "cancelled") {
      throw new Error("A foglalás lejárt vagy érvénytelen.")
    }
    if (hold.expiresAt < new Date()) {
      hold.status = "expired"
      await hold.save()
      await CampService.releaseSessionSeats(
        hold.sessionId,
        CampService.seatsRequired(hold.childCount)
      )
      throw new Error("A foglalás lejárt. Kezdje újra.")
    }

    const stripe = getStripeClient()
    const baseUrl = getAppBaseUrl()
    const now = new Date()
    const expiresAtUnix = stripeCheckoutExpiresAtUnix(now, hold.expiresAt)

    const lineName = `${hold.sessionLabel} — ${hold.ticketTypeName}`
    const discountNote =
      (hold.priceBreakdown?.familyDiscountHuf ?? 0) > 0
        ? ` (kedvezmény: ${hold.priceBreakdown?.familyDiscountPercent}%)`
        : ""
    const addonNote =
      (hold.laptopAddonCount ?? 0) > 0 || (hold.priceBreakdown?.addonsHuf ?? 0) > 0
        ? ` (+ kiegészítők)`
        : ""
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/foglalas/siker?holdId=${hold._id.toString()}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/foglalas/${hold.sessionId.toString()}?cancelled=1`,
      client_reference_id: hold._id.toString(),
      metadata: {
        campHoldId: hold._id.toString(),
        checkoutKind: "camp_booking",
      },
      payment_intent_data: {
        metadata: {
          campHoldId: hold._id.toString(),
          checkoutKind: "camp_booking",
        },
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "huf",
            unit_amount: toStripeHufAmount(hold.totalHuf),
            product_data: {
              name: lineName,
              description: `${hold.childCount} gyerek${addonNote}${discountNote}`,
            },
          },
        },
      ],
      payment_method_types: ["card"],
      locale: "hu",
      expires_at: expiresAtUnix,
      customer_email: hold.buyerEmail,
    })

    hold.status = "checkout_started"
    hold.stripeSessionId = checkoutSession.id
    const paymentIntentId =
      typeof checkoutSession.payment_intent === "string"
        ? checkoutSession.payment_intent
        : checkoutSession.payment_intent?.id
    if (paymentIntentId) hold.stripePaymentIntentId = paymentIntentId
    await hold.save()

    return {
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    }
  }

  static async getCheckoutStatus(holdId: string, stripeSessionId?: string | null) {
    if (!mongoose.Types.ObjectId.isValid(holdId)) {
      throw new Error("Érvénytelen foglalás.")
    }
    await dbConnect()
    const hold = await CampCheckoutHold.findById(holdId).lean()
    if (!hold) throw new Error("Foglalás nem található.")

    if (hold.status === "finalized" && hold.registrationId) {
      return {
        status: "finalized",
        registrationId: hold.registrationId.toString(),
      }
    }

    if (stripeSessionId && hold.stripeSessionId && stripeSessionId !== hold.stripeSessionId) {
      throw new Error("Session mismatch")
    }

    if (stripeSessionId && hold.status !== "finalized") {
      const stripe = getStripeClient()
      const checkoutSession = await stripe.checkout.sessions.retrieve(stripeSessionId)
      if (checkoutSession.payment_status === "paid") {
        await CampCheckoutService.finalizeHoldFromStripeSession(checkoutSession)
      }
    }

    const latest = await CampCheckoutHold.findById(holdId).lean()
    return {
      status: latest?.status ?? hold.status,
      registrationId: latest?.registrationId?.toString() ?? null,
      lastError: latest?.lastError ?? null,
    }
  }

  static async finalizeHoldFromStripeSession(checkoutSession: {
    id: string
    payment_status?: string | null
    metadata?: { campHoldId?: string } | null
    client_reference_id?: string | null
  }) {
    if (checkoutSession.payment_status !== "paid") return null

    const holdId =
      checkoutSession.metadata?.campHoldId || checkoutSession.client_reference_id
    if (!holdId || !mongoose.Types.ObjectId.isValid(holdId)) return null

    await dbConnect()
    const hold = await CampCheckoutHold.findOne({
      _id: holdId,
      stripeSessionId: checkoutSession.id,
      status: { $in: ["created", "checkout_started", "paid"] },
    })

    if (!hold) return null
    if (hold.status === "finalized" && hold.registrationId) {
      return hold.registrationId.toString()
    }

    hold.status = "paid"
    await hold.save()

    const seats = CampService.seatsRequired(hold.childCount)
    const camp = await Camp.findById(hold.campId).lean()

    const registration = await CampRegistration.create({
      campId: hold.campId,
      sessionId: hold.sessionId,
      ticketTypeId: hold.ticketTypeId,
      holdId: hold._id,
      buyerName: hold.buyerName,
      buyerEmail: hold.buyerEmail,
      buyerPhone: hold.buyerPhone,
      children: hold.children,
      ticketTypeName: hold.ticketTypeName,
      sessionLabel: hold.sessionLabel,
      campTitle: camp?.title || "",
      pricingMode: hold.pricingMode,
      childCount: hold.childCount,
      totalHuf: hold.totalHuf,
      laptopAddonHuf: hold.laptopAddonHuf ?? 0,
      laptopAddonCount: hold.laptopAddonCount ?? 0,
      priceBreakdown: hold.priceBreakdown,
      stripeSessionId: hold.stripeSessionId,
      paidAt: new Date(),
      status: "paid",
    })

    await CampService.confirmSessionSeats(hold.sessionId, seats)

    const { sendCampRegistrationConfirmationEmail } = await import(
      "../lib/send-registration-email"
    )
    void sendCampRegistrationConfirmationEmail(registration)

    hold.status = "finalized"
    hold.registrationId = registration._id
    await hold.save()

    return registration._id.toString()
  }

  static async expireHold(holdId: string) {
    if (!mongoose.Types.ObjectId.isValid(holdId)) return
    await dbConnect()
    const hold = await CampCheckoutHold.findById(holdId)
    if (!hold || hold.status === "finalized") return
    if (hold.status === "expired" || hold.status === "cancelled") return

    hold.status = "expired"
    await hold.save()
    await CampService.releaseSessionSeats(
      hold.sessionId,
      CampService.seatsRequired(hold.childCount)
    )
  }
}

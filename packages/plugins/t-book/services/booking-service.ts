import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import TBookBooking, {
  type ITBookBooking,
  type TBookBookingStatus,
} from "../models/TBookBooking"
import TBookEvent, { eventNights } from "../models/TBookEvent"
import TBookEventGroup from "../models/TBookEventGroup"
import TBookHotel from "../models/TBookHotel"
import { calculateBookingQuote, validateHotelSelections, validateSelections } from "../lib/pricing"
import type { TBookPriceQuote, TBookSelections } from "../lib/pricing-types"
import { mergeOptionSchemas } from "../lib/option-merge"
import {
  createBookingSchema,
  quoteRequestSchema,
  type CreateBookingInput,
  type QuoteRequest,
} from "../lib/schemas"
import {
  buildBookingQuery,
  type TBookBookingFilters,
} from "../lib/booking-query"
import {
  normalizeAttendeeFieldSchema,
  normalizeAttendeePayload,
  validateAttendees,
  type TBookAttendeeFieldDef,
} from "../lib/attendee-fields"
import { normalizeTBookCurrency, resolveBookingCurrency } from "../lib/currency"
import { mergeRegistrationFieldSchemas, resolveEventAttendeeFieldSchema } from "../lib/registration-fields"
import {
  accommodationGuestCount,
  resolvePlayersPerTicket,
} from "../lib/registration-headcount"
import { validateEligibility } from "../lib/eligibility"

function oid(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Érvénytelen azonosító.")
  }
  return new mongoose.Types.ObjectId(id)
}

const VALID_STATUS_TRANSITIONS: Record<TBookBookingStatus, TBookBookingStatus[]> = {
  pending: ["checkout_started", "confirmed", "cancelled", "expired"],
  checkout_started: ["paid", "cancelled", "expired"],
  paid: ["confirmed", "cancelled"],
  confirmed: ["cancelled"],
  cancelled: [],
  expired: [],
}

export type TBookQuoteContext = {
  event: NonNullable<Awaited<ReturnType<typeof TBookEvent.findById>>>
  quote: TBookPriceQuote
  hotelName: string
  nights: number
  selections: TBookSelections
}

export class TBookBookingService {
  /**
   * Server-side price calculation for an event + optional hotel + selections.
   * Used by the admin live preview, the public quote endpoint and booking
   * creation — client-provided totals are never trusted.
   */
  static async quote(input: QuoteRequest, opts?: { groupId?: mongoose.Types.ObjectId }) {
    const parsed = quoteRequestSchema.parse(input)
    await dbConnect()

    const eventQuery: Record<string, unknown> = { _id: oid(parsed.eventId), status: "active" }
    if (opts?.groupId) eventQuery.groupId = opts.groupId
    const event = await TBookEvent.findOne(eventQuery).lean()
    if (!event) throw new Error("Esemény nem található vagy nem aktív.")

    const group = event.groupId
      ? await TBookEventGroup.findById(event.groupId).lean()
      : null
    const groupOptions = group?.defaultBookingOptions ?? []

    let hotelName = ""
    let hotelCurrency: string | undefined
    let hotelRegistrationFields: TBookAttendeeFieldDef[] = []
    let accommodation = null
    let nights = 0
    const selections: TBookSelections = (parsed.selections ?? {}) as TBookSelections

    const maxHotelGuests = accommodationGuestCount(parsed.guests, event)
    let hotelGuests =
      parsed.accommodationGuests == null ? maxHotelGuests : parsed.accommodationGuests
    if (hotelGuests > maxHotelGuests) {
      throw new Error(
        `Szállás létszám legfeljebb ${maxHotelGuests} fő lehet (${parsed.guests} belépő).`
      )
    }

    const wantsHotel = Boolean(parsed.hotelId) && hotelGuests > 0

    if (wantsHotel && parsed.hotelId) {
      const hotelQuery: Record<string, unknown> = {
        _id: oid(parsed.hotelId),
        status: "active",
      }
      if (event.groupId) {
        hotelQuery.$or = [{ groupId: event.groupId }, { eventId: event._id }]
      } else {
        hotelQuery.eventId = event._id
      }
      const hotel = await TBookHotel.findOne(hotelQuery).lean()
      if (!hotel) throw new Error("Szállás nem található ehhez az eseményhez.")

      const errors = validateHotelSelections(hotel.pricing, selections, hotelGuests)
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(" "))
      }

      accommodation = hotel.pricing
      hotelName = hotel.name
      hotelCurrency = normalizeTBookCurrency(hotel.currency)
      hotelRegistrationFields = hotel.registrationFieldSchema ?? []
      nights = parsed.nights ?? eventNights(event)
    } else if (groupOptions.length > 0) {
      hotelGuests = 0
      const errors = validateSelections(groupOptions, selections)
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(" "))
      }
    } else {
      hotelGuests = 0
    }

    const eventCurrency = normalizeTBookCurrency(event.currency)
    resolveBookingCurrency(eventCurrency, hotelCurrency)

    const quote = calculateBookingQuote({
      ticketFeeHuf: event.ticketFeeHuf,
      ticketFeeMode: event.ticketFeeMode,
      ticketPriceBasis: event.ticketPriceBasis ?? "gross",
      ticketVatPercent: event.ticketVatPercent ?? 27,
      guests: parsed.guests,
      accommodationGuests: hotelGuests,
      nights,
      accommodation,
      groupOptions,
      groupPriceBasis: group?.defaultPriceBasis ?? "gross",
      groupVatPercent: group?.defaultVatPercent ?? 27,
      selections,
      pricingRules: event.pricingRules ?? null,
    })

    return {
      event,
      quote,
      hotelName,
      nights: quote.nights,
      selections,
      currency: eventCurrency,
      hotelCurrency,
      registrationFieldSchema: mergeRegistrationFieldSchemas(
        resolveEventAttendeeFieldSchema(
          group?.defaultAttendeeFieldSchema,
          event.attendeeFieldSchema,
          event.attendeeFieldSchemaMode ?? "extend"
        ),
        hotelRegistrationFields
      ),
    }
  }

  /**
   * Creates a pending booking with a server-calculated quote.
   * Payment (Stripe) is initiated separately by the checkout service.
   */
  static async createPendingBooking(
    input: CreateBookingInput,
    opts?: { groupId?: mongoose.Types.ObjectId }
  ): Promise<ITBookBooking> {
    const parsed = createBookingSchema.parse(input)
    const { event, quote, hotelName, nights, selections, currency, registrationFieldSchema } =
      await TBookBookingService.quote(
      {
        eventId: parsed.eventId,
        guests: parsed.guests,
        accommodationGuests: parsed.accommodationGuests,
        hotelId: parsed.hotelId,
        nights: parsed.nights,
        selections: parsed.selections,
      },
      opts
    )

    if (event.capacity != null) {
      const taken = await TBookBooking.aggregate<{ _id: null; guests: number }>([
        {
          $match: {
            eventId: event._id,
            status: { $in: ["pending", "checkout_started", "paid", "confirmed"] },
          },
        },
        { $group: { _id: null, guests: { $sum: "$guests" } } },
      ])
      const usedGuests = taken[0]?.guests ?? 0
      if (usedGuests + parsed.guests > event.capacity) {
        throw new Error("Nincs elég szabad hely erre az eseményre.")
      }
    }

    const registrationUnit = event.registrationUnit ?? "person"
    const teamMemberFieldSchema = normalizeAttendeeFieldSchema(event.teamMemberFieldSchema ?? [])
    const playersPerTicket = resolvePlayersPerTicket(event)
    const attendeeIssues = validateAttendees(
      registrationFieldSchema,
      parsed.guests,
      parsed.attendees,
      registrationUnit,
      {
        teamMemberFieldSchema,
        teamMemberLimit: event.teamMemberLimit ?? null,
        playersPerTicket: playersPerTicket > 1 ? playersPerTicket : null,
      }
    )
    if (attendeeIssues.length > 0) {
      throw new Error(attendeeIssues.map((issue) => issue.message).join(" "))
    }

    const eligibilityIssues = validateEligibility(
      event,
      parsed.attendees,
      registrationFieldSchema,
      teamMemberFieldSchema,
      playersPerTicket > 1 ? playersPerTicket : null
    )
    if (eligibilityIssues.length > 0) {
      throw new Error(eligibilityIssues.map((issue) => issue.message).join(" "))
    }
    const attendees = normalizeAttendeePayload(
      registrationFieldSchema,
      parsed.attendees,
      teamMemberFieldSchema
    )

    const group = event.groupId
      ? await TBookEventGroup.findById(event.groupId).lean()
      : null

    const hasHotel = Boolean(hotelName) && (quote.accommodationGuests ?? 0) > 0

    return TBookBooking.create({
      organizationId: group?.organizationId ?? event.organizationId ?? null,
      groupId: event.groupId,
      eventId: event._id,
      hotelId: hasHotel && parsed.hotelId ? oid(parsed.hotelId) : null,
      eventName: event.name,
      groupName: group?.name ?? "",
      hotelName: hasHotel ? hotelName : "",
      customer: {
        name: parsed.customer.name.trim(),
        email: parsed.customer.email.trim().toLowerCase(),
        phone: parsed.customer.phone.trim(),
        note: parsed.customer.note?.trim() ?? "",
      },
      billing: parsed.billing,
      checkoutReturnBaseUrl: parsed.returnBaseUrl?.trim() || null,
      attendeeFieldSchema: registrationFieldSchema,
      teamMemberFieldSchema,
      teamMemberLimit: event.teamMemberLimit ?? null,
      playersPerTicket: resolvePlayersPerTicket(event),
      attendees,
      guests: parsed.guests,
      nights,
      selections,
      quote,
      totalHuf: quote.totalHuf,
      currency,
      status: "pending",
    })
  }

  // ---- Admin --------------------------------------------------------------

  /** Aggregation `$match` does not auto-cast, so id filters become ObjectIds here. */
  private static castedQuery(filters: TBookBookingFilters): Record<string, unknown> {
    const query = buildBookingQuery(filters)
    for (const key of ["organizationId", "eventId", "groupId", "hotelId"] as const) {
      if (typeof query[key] === "string") query[key] = oid(query[key] as string)
    }
    return query
  }

  static async listBookingsAdmin(filters: TBookBookingFilters) {
    await dbConnect()
    const query = TBookBookingService.castedQuery(filters)
    const page = filters.page ?? 1
    const pageSize = filters.pageSize ?? 25

    const [items, total, totals] = await Promise.all([
      TBookBooking.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      TBookBooking.countDocuments(query),
      TBookBooking.aggregate<{ _id: null; revenueHuf: number; guests: number }>([
        { $match: { ...query, status: { $in: ["paid", "confirmed"] } } },
        { $group: { _id: null, revenueHuf: { $sum: "$totalHuf" }, guests: { $sum: "$guests" } } },
      ]),
    ])

    return {
      items,
      total,
      page,
      pageSize,
      filteredRevenueHuf: totals[0]?.revenueHuf ?? 0,
      filteredGuests: totals[0]?.guests ?? 0,
    }
  }

  /** Full (unpaginated) filtered list for exports. */
  static async listBookingsForExport(filters: TBookBookingFilters) {
    await dbConnect()
    const query = TBookBookingService.castedQuery(filters)
    return TBookBooking.find(query).sort({ createdAt: -1 }).lean()
  }

  static async getBookingAdmin(id: string, organizationId?: string): Promise<ITBookBooking | null> {
    await dbConnect()
    const booking = await TBookBooking.findById(oid(id)).lean<ITBookBooking>()
    if (!booking) return null
    if (organizationId && booking.organizationId && String(booking.organizationId) !== organizationId) {
      return null
    }
    return booking
  }

  static async updateStatus(
    id: string,
    nextStatus: TBookBookingStatus,
    organizationId?: string
  ): Promise<void> {
    await dbConnect()
    const booking = await TBookBooking.findById(oid(id))
    if (!booking) throw new Error("Foglalás nem található.")
    if (organizationId && booking.organizationId && String(booking.organizationId) !== organizationId) {
      throw new Error("A foglalás nem tartozik ehhez a szervezethez.")
    }
    const allowed = VALID_STATUS_TRANSITIONS[booking.status] ?? []
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Nem engedélyezett státusz váltás: ${booking.status} → ${nextStatus}`)
    }
    booking.status = nextStatus
    await booking.save()

    if (nextStatus === "cancelled") {
      const { voidVouchersForBooking } = await import("./voucher-service")
      void voidVouchersForBooking(id)
    }

    if (nextStatus === "paid" || nextStatus === "confirmed") {
      const { issueVouchersForBooking } = await import("./voucher-service")
      void issueVouchersForBooking(id)
    }
  }

  /** Distinct option keys/values across bookings of an event — powers smart filters. */
  static async listSelectionFacets(eventId?: string, organizationId?: string) {
    await dbConnect()
    const match: Record<string, unknown> = {
      status: { $in: ["paid", "confirmed", "pending", "checkout_started"] },
    }
    if (eventId) match.eventId = oid(eventId)
    if (organizationId) match.organizationId = oid(organizationId)

    const bookings = await TBookBooking.find(match).select("selections").limit(2000).lean()
    const facets = new Map<string, Set<string>>()
    for (const booking of bookings) {
      for (const [key, value] of Object.entries(booking.selections ?? {})) {
        if (!facets.has(key)) facets.set(key, new Set())
        const bucket = facets.get(key)!
        if (Array.isArray(value)) value.forEach((v) => bucket.add(String(v)))
        else bucket.add(String(value))
      }
    }
    return [...facets.entries()].map(([key, values]) => ({
      key,
      values: [...values].sort(),
    }))
  }
}

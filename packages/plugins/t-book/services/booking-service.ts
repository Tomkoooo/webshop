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
    let accommodation = null
    let nights = 0
    const selections: TBookSelections = (parsed.selections ?? {}) as TBookSelections

    if (parsed.hotelId) {
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

      const errors = validateHotelSelections(hotel.pricing, selections)
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(" "))
      }

      accommodation = hotel.pricing
      hotelName = hotel.name
      nights = parsed.nights ?? eventNights(event)
    } else if (groupOptions.length > 0) {
      const errors = validateSelections(groupOptions, selections)
      if (errors.length > 0) {
        throw new Error(errors.map((e) => e.message).join(" "))
      }
    }

    const quote = calculateBookingQuote({
      ticketFeeHuf: event.ticketFeeHuf,
      ticketFeeMode: event.ticketFeeMode,
      ticketPriceBasis: event.ticketPriceBasis ?? "gross",
      ticketVatPercent: event.ticketVatPercent ?? 27,
      guests: parsed.guests,
      nights,
      accommodation,
      groupOptions,
      groupPriceBasis: group?.defaultPriceBasis ?? "gross",
      groupVatPercent: group?.defaultVatPercent ?? 27,
      selections,
    })

    return { event, quote, hotelName, nights, selections }
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
    const { event, quote, hotelName, nights, selections } = await TBookBookingService.quote(
      {
        eventId: parsed.eventId,
        guests: parsed.guests,
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

    const group = event.groupId
      ? await TBookEventGroup.findById(event.groupId).lean()
      : null

    return TBookBooking.create({
      groupId: event.groupId,
      eventId: event._id,
      hotelId: parsed.hotelId ? oid(parsed.hotelId) : null,
      eventName: event.name,
      groupName: group?.name ?? "",
      hotelName,
      customer: {
        name: parsed.customer.name.trim(),
        email: parsed.customer.email.trim().toLowerCase(),
        phone: parsed.customer.phone.trim(),
        note: parsed.customer.note?.trim() ?? "",
      },
      billing: parsed.billing ?? null,
      guests: parsed.guests,
      nights,
      selections,
      quote,
      totalHuf: quote.totalHuf,
      status: "pending",
    })
  }

  // ---- Admin --------------------------------------------------------------

  /** Aggregation `$match` does not auto-cast, so id filters become ObjectIds here. */
  private static castedQuery(filters: TBookBookingFilters): Record<string, unknown> {
    const query = buildBookingQuery(filters)
    for (const key of ["eventId", "groupId", "hotelId"] as const) {
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

  static async getBookingAdmin(id: string): Promise<ITBookBooking | null> {
    await dbConnect()
    return TBookBooking.findById(oid(id)).lean<ITBookBooking>()
  }

  static async updateStatus(id: string, nextStatus: TBookBookingStatus): Promise<void> {
    await dbConnect()
    const booking = await TBookBooking.findById(oid(id))
    if (!booking) throw new Error("Foglalás nem található.")
    const allowed = VALID_STATUS_TRANSITIONS[booking.status] ?? []
    if (!allowed.includes(nextStatus)) {
      throw new Error(`Nem engedélyezett státusz váltás: ${booking.status} → ${nextStatus}`)
    }
    booking.status = nextStatus
    await booking.save()
  }

  /** Distinct option keys/values across bookings of an event — powers smart filters. */
  static async listSelectionFacets(eventId?: string) {
    await dbConnect()
    const match: Record<string, unknown> = {
      status: { $in: ["paid", "confirmed", "pending", "checkout_started"] },
    }
    if (eventId) match.eventId = oid(eventId)

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

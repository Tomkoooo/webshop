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
  createMultiBookingSchema,
  multiQuoteRequestSchema,
  quoteRequestSchema,
  type CreateBookingInput,
  type CreateMultiBookingInput,
  type MultiQuoteRequest,
  type QuoteRequest,
} from "../lib/schemas"
import {
  buildBookingQuery,
  type TBookBookingFilters,
} from "../lib/booking-query"
import {
  normalizeAttendeePayload,
  validateAttendees,
  type TBookAttendeeFieldDef,
} from "../lib/attendee-fields"
import { normalizeTBookCurrency, resolveBookingCurrency } from "../lib/currency"
import { mergeRegistrationFieldSchemas, resolveTeamMemberFieldSchema, resolveTicketAttendeeFieldSchema } from "../lib/registration-fields"
import {
  accommodationGuestCount,
  countRosterPlayers,
  resolvePlayersPerTicket,
} from "../lib/registration-headcount"
import { validateEligibility } from "../lib/eligibility"
import { normalizeHotelPricing } from "../lib/hotel-pricing"

function oid(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid identifier.")
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
    if (!event) throw new Error("Event not found or inactive.")

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
    const teamMemberCount = Math.min(
      maxHotelGuests,
      Math.max(1, Math.floor(parsed.teamMemberCount ?? countRosterPlayers(null, event, parsed.guests)))
    )
    let hotelGuests =
      parsed.accommodationGuests == null ? maxHotelGuests : parsed.accommodationGuests
    if (hotelGuests > maxHotelGuests) {
      throw new Error(
        `Accommodation guests cannot exceed ${maxHotelGuests} (${parsed.guests} entries).`
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
      if (!hotel) throw new Error("Hotel not found for this event.")

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
      playersPerTicket: resolvePlayersPerTicket(event),
      teamMemberCount,
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
        resolveTicketAttendeeFieldSchema({
          registrationUnit: event.registrationUnit ?? "person",
          groupSchema: group?.defaultAttendeeFieldSchema,
          eventSchema: event.attendeeFieldSchema,
          mode: event.attendeeFieldSchemaMode ?? "extend",
        }),
        hotelRegistrationFields
      ),
      teamMemberFieldSchema: resolveTeamMemberFieldSchema({
        registrationUnit: event.registrationUnit ?? "person",
        groupSchema: group?.defaultAttendeeFieldSchema,
        eventTeamMemberSchema: event.teamMemberFieldSchema,
        eventTicketSchema: event.attendeeFieldSchema,
        mode: event.attendeeFieldSchemaMode ?? "extend",
      }),
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
    const inferredTeamMemberCount =
      parsed.attendees && parsed.attendees.length > 0
        ? countRosterPlayers(
            parsed.attendees,
            { registrationUnit: "team", teamMemberLimit: 100 },
            parsed.guests
          )
        : parsed.teamMemberCount ?? undefined
    const {
      event,
      quote,
      hotelName,
      nights,
      selections,
      currency,
      registrationFieldSchema,
      teamMemberFieldSchema,
    } =
      await TBookBookingService.quote(
      {
        eventId: parsed.eventId,
        guests: parsed.guests,
        accommodationGuests: parsed.accommodationGuests,
        teamMemberCount: inferredTeamMemberCount,
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
        throw new Error("Not enough capacity left for this event.")
      }
    }

    if (parsed.hotelId && (quote.accommodationGuests ?? 0) > 0) {
      const hotel = await TBookHotel.findById(oid(parsed.hotelId))
        .select("pricing bookingCapacity roomInventory")
        .lean()
      if (hotel) {
        const pricing = normalizeHotelPricing(hotel.pricing)
        const {
          assertPackageInventoryAvailable,
          assertHotelBookingCapacityAvailable,
          assertHotelRoomInventoryAvailable,
        } = await import("../lib/package-inventory")
        await assertHotelBookingCapacityAvailable({
          hotelId: parsed.hotelId,
          bookingCapacity: hotel.bookingCapacity,
          accommodationGuests: quote.accommodationGuests ?? parsed.guests,
        })
        await assertHotelRoomInventoryAvailable({
          hotelId: parsed.hotelId,
          roomInventory: hotel.roomInventory,
          packages: pricing.packages ?? [],
          selections: selections as TBookSelections,
          accommodationGuests: quote.accommodationGuests ?? parsed.guests,
        })
        await assertPackageInventoryAvailable({
          hotelId: parsed.hotelId,
          packages: pricing.packages ?? [],
          selections: selections as TBookSelections,
          accommodationGuests: quote.accommodationGuests ?? parsed.guests,
        })
      }
    }

    const registrationUnit = event.registrationUnit ?? "person"
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

  /**
   * Quote multiple event entries. Combined lodging attaches hotel to the first
   * entry that has accommodation guests; other entries are ticket-only.
   */
  static async quoteMulti(input: MultiQuoteRequest, opts?: { groupId?: mongoose.Types.ObjectId }) {
    const parsed = multiQuoteRequestSchema.parse(input)
    const entryQuotes: Array<{
      eventId: string
      eventName: string
      quote: TBookPriceQuote
    }> = []

    for (let index = 0; index < parsed.entries.length; index++) {
      const entry = parsed.entries[index]
      const isPrimaryLodging = parsed.lodgingMode === "combined" && index === 0
      const separateLodging = parsed.lodgingMode === "separate"

      let hotelId: string | null | undefined = null
      let nights: number | null | undefined = null
      let selections = null
      let accommodationGuests: number | null | undefined = 0

      if (parsed.lodgingMode === "combined") {
        if (isPrimaryLodging) {
          hotelId = parsed.hotelId
          nights = parsed.nights
          selections = parsed.selections
          accommodationGuests = parsed.accommodationGuests ?? entry.accommodationGuests
        } else {
          hotelId = null
          nights = null
          selections = null
          accommodationGuests = 0
        }
      } else if (separateLodging) {
        hotelId = entry.hotelId
        nights = entry.nights
        selections = entry.selections
        accommodationGuests = entry.accommodationGuests
      }

      const { quote, event } = await TBookBookingService.quote(
        {
          eventId: entry.eventId,
          guests: entry.guests,
          accommodationGuests,
          teamMemberCount: entry.teamMemberCount,
          hotelId,
          nights,
          selections,
        },
        opts
      )
      entryQuotes.push({
        eventId: entry.eventId,
        eventName: event.name,
        quote,
      })
    }

    const totalHuf = entryQuotes.reduce((sum, row) => sum + row.quote.totalHuf, 0)
    const lines = entryQuotes.flatMap((row) =>
      row.quote.lines.map((line) => ({
        ...line,
        key: `${row.eventId}:${line.key}`,
        label: `${row.eventName}: ${line.label}`,
      }))
    )

    return {
      lodgingMode: parsed.lodgingMode,
      entries: entryQuotes,
      quote: {
        guests: entryQuotes.reduce((sum, row) => sum + row.quote.guests, 0),
        nights: entryQuotes.reduce((max, row) => Math.max(max, row.quote.nights), 0),
        ticketSubtotalHuf: entryQuotes.reduce((sum, row) => sum + row.quote.ticketSubtotalHuf, 0),
        accommodationBaseHuf: entryQuotes.reduce(
          (sum, row) => sum + row.quote.accommodationBaseHuf,
          0
        ),
        accommodationOptionsHuf: entryQuotes.reduce(
          (sum, row) => sum + row.quote.accommodationOptionsHuf,
          0
        ),
        accommodationSubtotalHuf: entryQuotes.reduce(
          (sum, row) => sum + row.quote.accommodationSubtotalHuf,
          0
        ),
        totalHuf,
        lines,
      } satisfies TBookPriceQuote,
    }
  }

  static async createPendingMultiBookings(
    input: CreateMultiBookingInput,
    opts?: { groupId?: mongoose.Types.ObjectId; checkoutBundleId?: string }
  ) {
    const parsed = createMultiBookingSchema.parse(input)
    const bundleId = opts?.checkoutBundleId ?? new mongoose.Types.ObjectId().toString()
    const bookings: ITBookBooking[] = []

    for (let index = 0; index < parsed.entries.length; index++) {
      const entry = parsed.entries[index]
      const isPrimaryLodging = parsed.lodgingMode === "combined" && index === 0

      let hotelId: string | null | undefined = null
      let nights: number | null | undefined = null
      let selections = null
      let accommodationGuests: number | null | undefined = 0

      if (parsed.lodgingMode === "combined") {
        if (isPrimaryLodging) {
          hotelId = parsed.hotelId
          nights = parsed.nights
          selections = parsed.selections
          accommodationGuests = parsed.accommodationGuests ?? entry.accommodationGuests
        }
      } else {
        hotelId = entry.hotelId
        nights = entry.nights
        selections = entry.selections
        accommodationGuests = entry.accommodationGuests
      }

      const booking = await TBookBookingService.createPendingBooking(
        {
          eventId: entry.eventId,
          guests: entry.guests,
          accommodationGuests,
          teamMemberCount: entry.teamMemberCount,
          customer: parsed.customer,
          billing: parsed.billing,
          returnBaseUrl: parsed.returnBaseUrl,
          hotelId,
          nights,
          selections,
          attendees: entry.attendees,
        },
        opts
      )
      booking.checkoutBundleId = bundleId
      await booking.save()
      bookings.push(booking)
    }

    return { bookings, checkoutBundleId: bundleId }
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
    if (!booking) throw new Error("Booking not found.")
    if (organizationId && booking.organizationId && String(booking.organizationId) !== organizationId) {
      throw new Error("Booking does not belong to this organization.")
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

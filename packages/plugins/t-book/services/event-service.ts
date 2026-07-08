import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import TBookEventGroup, { type ITBookEventGroup } from "../models/TBookEventGroup"
import TBookEvent, { eventNights, type ITBookEvent } from "../models/TBookEvent"
import TBookHotel, { type ITBookHotel } from "../models/TBookHotel"
import TBookBooking from "../models/TBookBooking"
import {
  eventGroupInputSchema,
  eventInputSchema,
  hotelInputSchema,
  type EventGroupInput,
  type EventInput,
  type HotelInput,
} from "../lib/schemas"
import { normalizeHotelPricing } from "../lib/hotel-pricing"
import { apiKeyHint, generateApiKey, hashApiKey } from "../lib/api-key"

function oid(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Érvénytelen azonosító.")
  }
  return new mongoose.Types.ObjectId(id)
}

export class TBookEventService {
  // ---- Event groups -------------------------------------------------------

  /** Creates a group and returns the plaintext API key exactly once. */
  static async createGroup(input: EventGroupInput): Promise<{ group: ITBookEventGroup; apiKey: string }> {
    const parsed = eventGroupInputSchema.parse(input)
    await dbConnect()
    const apiKey = generateApiKey()
    const group = await TBookEventGroup.create({
      ...parsed,
      apiKeyHash: hashApiKey(apiKey),
      apiKeyHint: apiKeyHint(apiKey),
      apiKeyCreatedAt: new Date(),
    })
    return { group, apiKey }
  }

  static async listGroups(): Promise<ITBookEventGroup[]> {
    await dbConnect()
    return TBookEventGroup.find({}).sort({ createdAt: -1 }).lean<ITBookEventGroup[]>()
  }

  static async getGroup(id: string): Promise<ITBookEventGroup | null> {
    await dbConnect()
    return TBookEventGroup.findById(oid(id)).lean<ITBookEventGroup>()
  }

  static async updateGroup(id: string, input: Partial<EventGroupInput>): Promise<void> {
    const parsed = eventGroupInputSchema.partial().parse(input)
    await dbConnect()
    await TBookEventGroup.updateOne({ _id: oid(id) }, { $set: parsed })
  }

  static async deleteGroup(id: string): Promise<void> {
    await dbConnect()
    const groupOid = oid(id)
    const eventCount = await TBookEvent.countDocuments({ groupId: groupOid })
    if (eventCount > 0) {
      throw new Error("A csoport nem törölhető, amíg események tartoznak hozzá.")
    }
    await TBookEventGroup.deleteOne({ _id: groupOid })
  }

  /** Revokes the old key and returns the new plaintext key exactly once. */
  static async rotateGroupApiKey(id: string): Promise<string> {
    await dbConnect()
    const apiKey = generateApiKey()
    const result = await TBookEventGroup.updateOne(
      { _id: oid(id) },
      {
        $set: {
          apiKeyHash: hashApiKey(apiKey),
          apiKeyHint: apiKeyHint(apiKey),
          apiKeyCreatedAt: new Date(),
        },
      }
    )
    if (result.matchedCount === 0) throw new Error("Csoport nem található.")
    return apiKey
  }

  static async findGroupByApiKeyHash(hash: string): Promise<ITBookEventGroup | null> {
    await dbConnect()
    return TBookEventGroup.findOne({ apiKeyHash: hash, status: "active" }).lean<ITBookEventGroup>()
  }

  // ---- Events -------------------------------------------------------------

  static async createEvent(input: EventInput): Promise<ITBookEvent> {
    const parsed = eventInputSchema.parse(input)
    if (parsed.endDate < parsed.startDate) {
      throw new Error("A záró dátum nem lehet a kezdő dátum előtt.")
    }
    await dbConnect()
    return TBookEvent.create({
      ...parsed,
      groupId: parsed.groupId ? oid(parsed.groupId) : null,
    })
  }

  static async listEvents(filter?: { groupId?: string | null }): Promise<ITBookEvent[]> {
    await dbConnect()
    const query: Record<string, unknown> = {}
    if (filter?.groupId) query.groupId = oid(filter.groupId)
    return TBookEvent.find(query).sort({ sortOrder: 1, startDate: 1 }).lean<ITBookEvent[]>()
  }

  static async getEvent(id: string): Promise<ITBookEvent | null> {
    await dbConnect()
    return TBookEvent.findById(oid(id)).lean<ITBookEvent>()
  }

  static async updateEvent(id: string, input: Partial<EventInput>): Promise<void> {
    const parsed = eventInputSchema.partial().parse(input)
    await dbConnect()
    const patch: Record<string, unknown> = { ...parsed }
    if (parsed.groupId !== undefined) {
      patch.groupId = parsed.groupId ? oid(parsed.groupId) : null
    }
    await TBookEvent.updateOne({ _id: oid(id) }, { $set: patch })
  }

  static async deleteEvent(id: string): Promise<void> {
    await dbConnect()
    const eventOid = oid(id)
    const bookingCount = await TBookBooking.countDocuments({
      eventId: eventOid,
      status: { $in: ["paid", "confirmed"] },
    })
    if (bookingCount > 0) {
      throw new Error("Az esemény nem törölhető, mert fizetett foglalások tartoznak hozzá. Archiváld inkább.")
    }
    await TBookHotel.deleteMany({ eventId: eventOid })
    await TBookEvent.deleteOne({ _id: eventOid })
  }

  static async reorderEvents(orderedIds: string[]): Promise<void> {
    await dbConnect()
    await Promise.all(
      orderedIds.map((id, index) =>
        TBookEvent.updateOne({ _id: oid(id) }, { $set: { sortOrder: index } })
      )
    )
  }

  // ---- Hotels -------------------------------------------------------------

  static async listHotelsForGroup(groupId: string): Promise<ITBookHotel[]> {
    await dbConnect()
    const groupOid = oid(groupId)
    const eventIds = await TBookEvent.find({ groupId: groupOid }).distinct("_id")
    return TBookHotel.find({
      $or: [{ groupId: groupOid }, { eventId: { $in: eventIds } }],
    })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ITBookHotel[]>()
  }

  static async createHotel(input: HotelInput): Promise<ITBookHotel> {
    const parsed = hotelInputSchema.parse(input)
    await dbConnect()

    let groupOid: mongoose.Types.ObjectId | null = parsed.groupId ? oid(parsed.groupId) : null
    if (groupOid) {
      const group = await TBookEventGroup.findById(groupOid).lean()
      if (!group) throw new Error("Csoport nem található.")
    } else if (parsed.eventId) {
      const event = await TBookEvent.findById(oid(parsed.eventId)).lean()
      if (!event) throw new Error("Esemény nem található.")
      groupOid = event.groupId
    } else {
      throw new Error("Csoport vagy esemény megadása kötelező.")
    }

    const normalized = normalizeHotelPricing(parsed.pricing)
    const pricing = {
      priceBasis: normalized.priceBasis ?? "net",
      vatPercent: normalized.vatPercent ?? 27,
      roomTypes: normalized.roomTypes,
      addonGroups: normalized.addonGroups,
    }
    const { groupId: _g, eventId: _e, ...rest } = parsed
    return TBookHotel.create({
      ...rest,
      pricing,
      groupId: groupOid,
      eventId: null,
    })
  }

  static async listHotels(eventId: string): Promise<ITBookHotel[]> {
    await dbConnect()
    const event = await TBookEvent.findById(oid(eventId)).lean()
    if (event?.groupId) {
      return TBookEventService.listHotelsForGroup(String(event.groupId))
    }
    return TBookHotel.find({ eventId: oid(eventId) })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ITBookHotel[]>()
  }

  static async getHotel(id: string): Promise<ITBookHotel | null> {
    await dbConnect()
    return TBookHotel.findById(oid(id)).lean<ITBookHotel>()
  }

  static async updateHotel(id: string, input: Partial<HotelInput>): Promise<void> {
    const parsed = hotelInputSchema.partial().parse(input)
    await dbConnect()
    const patch: Record<string, unknown> = { ...parsed }
    delete patch.eventId
    if (parsed.pricing) {
      const normalized = normalizeHotelPricing(parsed.pricing)
      patch.pricing = {
        priceBasis: normalized.priceBasis ?? "net",
        vatPercent: normalized.vatPercent ?? 27,
        roomTypes: normalized.roomTypes,
        addonGroups: normalized.addonGroups,
      }
    }
    await TBookHotel.updateOne({ _id: oid(id) }, { $set: patch })
  }

  static async deleteHotel(id: string): Promise<void> {
    await dbConnect()
    const hotelOid = oid(id)
    const bookingCount = await TBookBooking.countDocuments({
      hotelId: hotelOid,
      status: { $in: ["paid", "confirmed"] },
    })
    if (bookingCount > 0) {
      throw new Error("A hotel nem törölhető, mert fizetett foglalások tartoznak hozzá. Archiváld inkább.")
    }
    await TBookHotel.deleteOne({ _id: hotelOid })
  }

  // ---- Public (API-key scoped) reads --------------------------------------

  static async listPublicEventsForGroup(groupId: mongoose.Types.ObjectId) {
    await dbConnect()
    const events = await TBookEvent.find({ groupId, status: "active" })
      .sort({ sortOrder: 1, startDate: 1 })
      .lean()
    return events.map((e) => ({
      id: String(e._id),
      name: e.name,
      description: e.description,
      location: {
        address: e.location?.address ?? "",
        lat: e.location?.lat ?? null,
        lng: e.location?.lng ?? null,
        mapEmbedUrl: e.location?.mapEmbedUrl ?? "",
      },
      startDate: e.startDate,
      endDate: e.endDate,
      nights: eventNights(e),
      ticketFeeHuf: e.ticketFeeHuf,
      ticketFeeMode: e.ticketFeeMode,
      heroImage: e.heroImage,
    }))
  }

  static async getPublicEventDetail(groupId: mongoose.Types.ObjectId, eventId: string) {
    await dbConnect()
    const event = await TBookEvent.findOne({ _id: oid(eventId), groupId, status: "active" }).lean()
    if (!event) return null
    const group = await TBookEventGroup.findById(groupId).lean()
    const hotels = await TBookEventService.listHotelsForGroup(String(groupId))
    const activeHotels = hotels.filter((h) => h.status === "active")
    return {
      event: {
        id: String(event._id),
        name: event.name,
        description: event.description,
        location: {
          address: event.location?.address ?? "",
          lat: event.location?.lat ?? null,
          lng: event.location?.lng ?? null,
          mapEmbedUrl: event.location?.mapEmbedUrl ?? "",
        },
        startDate: event.startDate,
        endDate: event.endDate,
        nights: eventNights(event),
        ticketFeeHuf: event.ticketFeeHuf,
        ticketFeeMode: event.ticketFeeMode,
        heroImage: event.heroImage,
      },
      groupBookingOptions: group?.defaultBookingOptions ?? [],
      hotels: activeHotels.map((h) => ({
        id: String(h._id),
        name: h.name,
        description: h.description,
        address: h.address,
        distanceFromVenueKm: h.distanceFromVenueKm ?? null,
        gallery: h.gallery,
        pricing: h.pricing,
      })),
    }
  }

  // ---- Dashboard ----------------------------------------------------------

  static async getDashboardStats() {
    await dbConnect()
    const now = new Date()
    const [groupCount, eventCount, upcomingEvents, bookingAgg, recentBookings] = await Promise.all([
      TBookEventGroup.countDocuments({ status: { $ne: "archived" } }),
      TBookEvent.countDocuments({ status: "active" }),
      TBookEvent.countDocuments({ status: "active", startDate: { $gte: now } }),
      TBookBooking.aggregate<{ _id: string; count: number; revenueHuf: number; guests: number }>([
        { $match: { status: { $in: ["paid", "confirmed"] } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenueHuf: { $sum: "$totalHuf" },
            guests: { $sum: "$guests" },
          },
        },
      ]),
      TBookBooking.find({ status: { $in: ["paid", "confirmed", "pending"] } })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ])

    const paidStats = bookingAgg.reduce(
      (acc, row) => ({
        count: acc.count + row.count,
        revenueHuf: acc.revenueHuf + row.revenueHuf,
        guests: acc.guests + row.guests,
      }),
      { count: 0, revenueHuf: 0, guests: 0 }
    )
    const pendingCount = await TBookBooking.countDocuments({ status: "pending" })

    return {
      groupCount,
      eventCount,
      upcomingEvents,
      bookingCount: paidStats.count,
      revenueHuf: paidStats.revenueHuf,
      guestCount: paidStats.guests,
      pendingCount,
      recentBookings: recentBookings.map((b) => ({
        id: String(b._id),
        customerName: b.customer.name,
        eventName: b.eventName,
        hotelName: b.hotelName,
        totalHuf: b.totalHuf,
        status: b.status,
        createdAt: b.createdAt,
      })),
    }
  }
}

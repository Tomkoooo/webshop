import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import TBookEventGroup, { type ITBookEventGroup } from "../models/TBookEventGroup"
import TBookEvent, { eventNights, type ITBookEvent } from "../models/TBookEvent"
import TBookHotel, { type ITBookHotel } from "../models/TBookHotel"
import TBookBooking from "../models/TBookBooking"
import TBookOrganization from "../models/TBookOrganization"
import {
  eventGroupInputSchema,
  eventGroupUpdateSchema,
  eventInputSchema,
  eventUpdateSchema,
  hotelInputSchema,
  hotelInputUpdateSchema,
  type EventGroupInput,
  type EventGroupUpdateInput,
  type EventInput,
  type EventUpdateInput,
  type HotelInput,
  type HotelUpdateInput,
} from "../lib/schemas"
import { assignPricingKeys, normalizeHotelPricing, resolveAccommodationMode } from "../lib/hotel-pricing"
import { isEventListedOnPublicSite } from "../lib/event-public-listing"
import { resolveEventHeroImage } from "../lib/event-hero"
import { publicEligibilityFromEvent } from "../lib/public-eligibility"
import { resolveEventAttendeeFieldSchema } from "../lib/registration-fields"
import { normalizeAttendeeFieldSchema } from "../lib/attendee-fields"
import { apiKeyHint, generateApiKey, hashApiKey } from "../lib/api-key"
import { DEFAULT_TBOOK_CURRENCY, normalizeTBookCurrency } from "../lib/currency"

function oid(id: string): mongoose.Types.ObjectId {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Érvénytelen azonosító.")
  }
  return new mongoose.Types.ObjectId(id)
}

async function getOrgDefaultCurrency(organizationId?: string): Promise<string> {
  if (!organizationId) return DEFAULT_TBOOK_CURRENCY
  await dbConnect()
  const org = await TBookOrganization.findById(oid(organizationId))
    .select("settings.currency")
    .lean()
  return normalizeTBookCurrency(org?.settings?.currency)
}

function serializeHotelPricing(pricing: ReturnType<typeof normalizeHotelPricing>) {
  return {
    priceBasis: pricing.priceBasis ?? "net",
    vatPercent: pricing.vatPercent ?? 27,
    accommodationMode: pricing.accommodationMode,
    roomTypes: pricing.roomTypes,
    packages: pricing.packages ?? [],
    extrasSection: pricing.extrasSection ?? null,
  }
}

function orgFilter(organizationId?: string): Record<string, unknown> {
  return organizationId ? { organizationId: oid(organizationId) } : {}
}

async function assertGroupInOrg(groupId: string, organizationId?: string) {
  if (!organizationId) return
  const group = await TBookEventGroup.findById(oid(groupId)).select("organizationId").lean()
  if (!group || String(group.organizationId) !== organizationId) {
    throw new Error("A csoport nem tartozik ehhez a szervezethez.")
  }
}

export class TBookEventService {
  // ---- Event groups -------------------------------------------------------

  /** Creates a group and returns the plaintext API key exactly once. */
  static async createGroup(
    input: EventGroupInput,
    organizationId?: string
  ): Promise<{ group: ITBookEventGroup; apiKey: string }> {
    const parsed = eventGroupInputSchema.parse(input)
    await dbConnect()
    const apiKey = generateApiKey()
    const group = await TBookEventGroup.create({
      ...parsed,
      defaultAttendeeFieldSchema: normalizeAttendeeFieldSchema(parsed.defaultAttendeeFieldSchema),
      ...(organizationId ? { organizationId: oid(organizationId) } : {}),
      apiKeyHash: hashApiKey(apiKey),
      apiKeyHint: apiKeyHint(apiKey),
      apiKeyCreatedAt: new Date(),
    })
    return { group, apiKey }
  }

  static async listGroups(organizationId?: string): Promise<ITBookEventGroup[]> {
    await dbConnect()
    return TBookEventGroup.find(orgFilter(organizationId)).sort({ createdAt: -1 }).lean<ITBookEventGroup[]>()
  }

  static async getGroup(id: string, organizationId?: string): Promise<ITBookEventGroup | null> {
    await dbConnect()
    const group = await TBookEventGroup.findById(oid(id)).lean<ITBookEventGroup>()
    if (!group) return null
    if (organizationId && String(group.organizationId) !== organizationId) return null
    return group
  }

  static async updateGroup(
    id: string,
    input: EventGroupUpdateInput | Partial<EventGroupInput>,
    organizationId?: string
  ): Promise<void> {
    const parsed = eventGroupUpdateSchema.parse(input)
    await dbConnect()
    await assertGroupInOrg(id, organizationId)
    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) patch[key] = value
    }
    if (parsed.defaultAttendeeFieldSchema !== undefined) {
      patch.defaultAttendeeFieldSchema = normalizeAttendeeFieldSchema(parsed.defaultAttendeeFieldSchema)
    }
    if (Object.keys(patch).length === 0) return
    await TBookEventGroup.updateOne({ _id: oid(id), ...orgFilter(organizationId) }, { $set: patch })
  }

  static async deleteGroup(id: string, organizationId?: string): Promise<void> {
    await dbConnect()
    await assertGroupInOrg(id, organizationId)
    const groupOid = oid(id)
    const eventCount = await TBookEvent.countDocuments({ groupId: groupOid, ...orgFilter(organizationId) })
    if (eventCount > 0) {
      throw new Error("A csoport nem törölhető, amíg események tartoznak hozzá.")
    }
    await TBookEventGroup.deleteOne({ _id: groupOid, ...orgFilter(organizationId) })
  }

  /** Revokes the old key and returns the new plaintext key exactly once. */
  static async rotateGroupApiKey(id: string, organizationId?: string): Promise<string> {
    await dbConnect()
    await assertGroupInOrg(id, organizationId)
    const apiKey = generateApiKey()
    const result = await TBookEventGroup.updateOne(
      { _id: oid(id), ...orgFilter(organizationId) },
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

  static async createEvent(input: EventInput, organizationId?: string): Promise<ITBookEvent> {
    const parsed = eventInputSchema.parse(input)
    if (parsed.endDate < parsed.startDate) {
      throw new Error("A záró dátum nem lehet a kezdő dátum előtt.")
    }
    await dbConnect()
    let resolvedOrgId = organizationId ? oid(organizationId) : null
    if (parsed.groupId) {
      const group = await TBookEventGroup.findById(oid(parsed.groupId)).lean()
      if (!group) throw new Error("Csoport nem található.")
      if (organizationId && String(group.organizationId) !== organizationId) {
        throw new Error("A csoport nem tartozik ehhez a szervezethez.")
      }
      resolvedOrgId = group.organizationId ?? resolvedOrgId
    }
    const currency = normalizeTBookCurrency(
      parsed.currency ?? (await getOrgDefaultCurrency(resolvedOrgId ? String(resolvedOrgId) : organizationId))
    )
    return TBookEvent.create({
      ...parsed,
      currency,
      attendeeFieldSchema: normalizeAttendeeFieldSchema(parsed.attendeeFieldSchema),
      teamMemberFieldSchema: normalizeAttendeeFieldSchema(parsed.teamMemberFieldSchema),
      groupId: parsed.groupId ? oid(parsed.groupId) : null,
      ...(resolvedOrgId ? { organizationId: resolvedOrgId } : {}),
    })
  }

  static async listEvents(filter?: { groupId?: string | null; organizationId?: string }): Promise<ITBookEvent[]> {
    await dbConnect()
    const query: Record<string, unknown> = { ...orgFilter(filter?.organizationId) }
    if (filter?.groupId) query.groupId = oid(filter.groupId)
    return TBookEvent.find(query).sort({ sortOrder: 1, startDate: 1 }).lean<ITBookEvent[]>()
  }

  static async getEvent(id: string, organizationId?: string): Promise<ITBookEvent | null> {
    await dbConnect()
    const event = await TBookEvent.findById(oid(id)).lean<ITBookEvent>()
    if (!event) return null
    if (organizationId && event.organizationId && String(event.organizationId) !== organizationId) {
      return null
    }
    return event
  }

  static async updateEvent(
    id: string,
    input: EventUpdateInput | Partial<EventInput>,
    organizationId?: string
  ): Promise<void> {
    const parsed = eventUpdateSchema.parse(input)
    await dbConnect()
    const existing = await TBookEvent.findById(oid(id)).lean()
    if (!existing) throw new Error("Esemény nem található.")
    if (organizationId && existing.organizationId && String(existing.organizationId) !== organizationId) {
      throw new Error("Az esemény nem tartozik ehhez a szervezethez.")
    }
    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined) patch[key] = value
    }
    if (parsed.groupId !== undefined) {
      patch.groupId = parsed.groupId ? oid(parsed.groupId) : null
      if (parsed.groupId) await assertGroupInOrg(parsed.groupId, organizationId)
    }
    if (parsed.attendeeFieldSchema !== undefined) {
      patch.attendeeFieldSchema = normalizeAttendeeFieldSchema(parsed.attendeeFieldSchema)
    }
    if (parsed.teamMemberFieldSchema !== undefined) {
      patch.teamMemberFieldSchema = normalizeAttendeeFieldSchema(parsed.teamMemberFieldSchema)
    }
    if (parsed.currency !== undefined) {
      patch.currency = normalizeTBookCurrency(parsed.currency)
    }
    if (Object.keys(patch).length === 0) return
    await TBookEvent.updateOne({ _id: oid(id), ...orgFilter(organizationId) }, { $set: patch })
  }

  static async deleteEvent(id: string, organizationId?: string): Promise<void> {
    await dbConnect()
    const eventOid = oid(id)
    const existing = await TBookEvent.findById(eventOid).lean()
    if (!existing) throw new Error("Esemény nem található.")
    if (organizationId && existing.organizationId && String(existing.organizationId) !== organizationId) {
      throw new Error("Az esemény nem tartozik ehhez a szervezethez.")
    }
    const bookingCount = await TBookBooking.countDocuments({
      eventId: eventOid,
      status: { $in: ["paid", "confirmed"] },
      ...orgFilter(organizationId),
    })
    if (bookingCount > 0) {
      throw new Error("Az esemény nem törölhető, mert fizetett foglalások tartoznak hozzá. Archiváld inkább.")
    }
    await TBookHotel.deleteMany({ eventId: eventOid, ...orgFilter(organizationId) })
    await TBookEvent.deleteOne({ _id: eventOid, ...orgFilter(organizationId) })
  }

  static async reorderEvents(orderedIds: string[], organizationId?: string): Promise<void> {
    await dbConnect()
    await Promise.all(
      orderedIds.map(async (id, index) => {
        const event = await TBookEvent.findById(oid(id)).select("organizationId").lean()
        if (!event) return
        if (organizationId && event.organizationId && String(event.organizationId) !== organizationId) return
        await TBookEvent.updateOne({ _id: oid(id) }, { $set: { sortOrder: index } })
      })
    )
  }

  // ---- Hotels -------------------------------------------------------------

  static async listHotelsForGroup(groupId: string, organizationId?: string): Promise<ITBookHotel[]> {
    await dbConnect()
    await assertGroupInOrg(groupId, organizationId)
    const groupOid = oid(groupId)
    const eventIds = await TBookEvent.find({ groupId: groupOid, ...orgFilter(organizationId) }).distinct("_id")
    return TBookHotel.find({
      $or: [{ groupId: groupOid }, { eventId: { $in: eventIds } }],
      ...orgFilter(organizationId),
    })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ITBookHotel[]>()
  }

  static async createHotel(input: HotelInput, organizationId?: string): Promise<ITBookHotel> {
    const parsed = hotelInputSchema.parse(input)
    await dbConnect()

    let groupOid: mongoose.Types.ObjectId | null = parsed.groupId ? oid(parsed.groupId) : null
    let resolvedOrgId: mongoose.Types.ObjectId | null = organizationId ? oid(organizationId) : null
    if (groupOid) {
      const group = await TBookEventGroup.findById(groupOid).lean()
      if (!group) throw new Error("Csoport nem található.")
      if (organizationId && String(group.organizationId) !== organizationId) {
        throw new Error("A csoport nem tartozik ehhez a szervezethez.")
      }
      resolvedOrgId = group.organizationId ?? resolvedOrgId
    } else if (parsed.eventId) {
      const event = await TBookEvent.findById(oid(parsed.eventId)).lean()
      if (!event) throw new Error("Esemény nem található.")
      if (organizationId && event.organizationId && String(event.organizationId) !== organizationId) {
        throw new Error("Az esemény nem tartozik ehhez a szervezethez.")
      }
      groupOid = event.groupId
      resolvedOrgId = event.organizationId ?? resolvedOrgId
    } else {
      throw new Error("Csoport vagy esemény megadása kötelező.")
    }

    const normalized = assignPricingKeys(normalizeHotelPricing(parsed.pricing))
    const pricing = serializeHotelPricing(normalized)
    const currency = normalizeTBookCurrency(
      parsed.currency ?? (await getOrgDefaultCurrency(resolvedOrgId ? String(resolvedOrgId) : organizationId))
    )
    const { groupId: _g, eventId: _e, ...rest } = parsed
    return TBookHotel.create({
      ...rest,
      pricing,
      currency,
      registrationFieldSchema: normalizeAttendeeFieldSchema(parsed.registrationFieldSchema),
      groupId: groupOid,
      eventId: null,
      ...(resolvedOrgId ? { organizationId: resolvedOrgId } : {}),
    })
  }

  static async listHotels(eventId: string, organizationId?: string): Promise<ITBookHotel[]> {
    await dbConnect()
    const event = await TBookEvent.findById(oid(eventId)).lean()
    if (organizationId && event?.organizationId && String(event.organizationId) !== organizationId) {
      return []
    }
    if (event?.groupId) {
      return TBookEventService.listHotelsForGroup(String(event.groupId), organizationId)
    }
    return TBookHotel.find({ eventId: oid(eventId), ...orgFilter(organizationId) })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean<ITBookHotel[]>()
  }

  static async getHotel(id: string, organizationId?: string): Promise<ITBookHotel | null> {
    await dbConnect()
    const hotel = await TBookHotel.findById(oid(id)).lean<ITBookHotel>()
    if (!hotel) return null
    if (organizationId && hotel.organizationId && String(hotel.organizationId) !== organizationId) {
      return null
    }
    return hotel
  }

  static async updateHotel(id: string, input: HotelUpdateInput, organizationId?: string): Promise<void> {
    const parsed = hotelInputUpdateSchema.parse(input)
    await dbConnect()
    const existing = await TBookHotel.findById(oid(id)).lean()
    if (!existing) throw new Error("Szállás nem található.")
    if (organizationId && existing.organizationId && String(existing.organizationId) !== organizationId) {
      throw new Error("A szállás nem tartozik ehhez a szervezethez.")
    }
    const patch: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (value !== undefined && key !== "eventId") patch[key] = value
    }
    if (parsed.pricing) {
      const normalized = assignPricingKeys(normalizeHotelPricing(parsed.pricing))
      patch.pricing = serializeHotelPricing(normalized)
    }
    if (parsed.currency !== undefined) {
      patch.currency = normalizeTBookCurrency(parsed.currency)
    }
    if (parsed.registrationFieldSchema !== undefined) {
      patch.registrationFieldSchema = normalizeAttendeeFieldSchema(parsed.registrationFieldSchema)
    }
    await TBookHotel.updateOne({ _id: oid(id), ...orgFilter(organizationId) }, { $set: patch })
  }

  static async deleteHotel(id: string, organizationId?: string): Promise<void> {
    await dbConnect()
    const hotelOid = oid(id)
    const existing = await TBookHotel.findById(hotelOid).lean()
    if (!existing) throw new Error("Szállás nem található.")
    if (organizationId && existing.organizationId && String(existing.organizationId) !== organizationId) {
      throw new Error("A szállás nem tartozik ehhez a szervezethez.")
    }
    const bookingCount = await TBookBooking.countDocuments({
      hotelId: hotelOid,
      status: { $in: ["paid", "confirmed"] },
      ...orgFilter(organizationId),
    })
    if (bookingCount > 0) {
      throw new Error("A hotel nem törölhető, mert fizetett foglalások tartoznak hozzá. Archiváld inkább.")
    }
    await TBookHotel.deleteOne({ _id: hotelOid, ...orgFilter(organizationId) })
  }

  // ---- Public directory (no API key) --------------------------------------

  static async listPublicDirectory() {
    await dbConnect()
    const now = new Date()
    const groups = await TBookEventGroup.find({
      status: "active",
      listOnTBookSite: true,
    })
      .sort({ name: 1 })
      .lean<ITBookEventGroup[]>()

    const listings = await Promise.all(
      groups.map(async (group) => {
        const groupOid = group._id as mongoose.Types.ObjectId
        const [activeEventCount, nextEvent] = await Promise.all([
          TBookEvent.countDocuments({
            groupId: groupOid,
            status: "active",
            endDate: { $gte: now },
          }),
          TBookEvent.findOne({
            groupId: groupOid,
            status: "active",
            endDate: { $gte: now },
          })
            .sort({ startDate: 1 })
            .lean<ITBookEvent>(),
        ])
        return {
          id: String(groupOid),
          title: group.listingTitle?.trim() || group.name,
          url: group.listingUrl ?? "",
          image: group.listingImage ?? "",
          activeEventCount,
          nextEventStart: nextEvent?.startDate ?? null,
        }
      })
    )

    return listings.filter((listing) => listing.activeEventCount > 0)
  }

  // ---- Public (API-key scoped) reads --------------------------------------

  static async getOrganizationCurrencyForGroup(
    groupId: mongoose.Types.ObjectId
  ): Promise<string> {
    await dbConnect()
    const group = await TBookEventGroup.findById(groupId).select("organizationId").lean()
    if (!group?.organizationId) return DEFAULT_TBOOK_CURRENCY
    const org = await TBookOrganization.findById(group.organizationId)
      .select("settings.currency")
      .lean()
    return normalizeTBookCurrency(org?.settings?.currency)
  }

  static async listPublicEventsForGroup(groupId: mongoose.Types.ObjectId) {
    await dbConnect()
    const group = await TBookEventGroup.findById(groupId)
      .select("defaultHeroImage defaultAttendeeFieldSchema")
      .lean()
    const events = await TBookEvent.find({ groupId, status: "active" })
      .sort({ sortOrder: 1, startDate: 1 })
      .lean()
    return events
      .filter((e) => isEventListedOnPublicSite(e.publicListing))
      .map((e) => ({
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
      startTime: e.startTime ?? null,
      endTime: e.endTime ?? null,
      nights: eventNights(e),
      ticketFeeHuf: e.ticketFeeHuf,
      ticketFeeMode: e.ticketFeeMode,
      registrationUnit: e.registrationUnit ?? "person",
      playersPerTicket: e.playersPerTicket ?? 1,
      teamMemberLimit: e.teamMemberLimit ?? null,
      teamMemberFieldSchema: normalizeAttendeeFieldSchema(e.teamMemberFieldSchema ?? []),
      currency: normalizeTBookCurrency(e.currency),
      heroImage: resolveEventHeroImage(e, group),
      attendeeFieldSchema: resolveEventAttendeeFieldSchema(
        group?.defaultAttendeeFieldSchema,
        e.attendeeFieldSchema,
        e.attendeeFieldSchemaMode ?? "extend"
      ),
      ...publicEligibilityFromEvent(e),
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
        startTime: event.startTime ?? null,
        endTime: event.endTime ?? null,
        nights: eventNights(event),
        ticketFeeHuf: event.ticketFeeHuf,
        ticketFeeMode: event.ticketFeeMode,
      registrationUnit: event.registrationUnit ?? "person",
      playersPerTicket: event.playersPerTicket ?? 1,
      teamMemberLimit: event.teamMemberLimit ?? null,
        teamMemberFieldSchema: normalizeAttendeeFieldSchema(event.teamMemberFieldSchema ?? []),
        currency: normalizeTBookCurrency(event.currency),
        heroImage: resolveEventHeroImage(event, group),
        attendeeFieldSchema: resolveEventAttendeeFieldSchema(
          group?.defaultAttendeeFieldSchema,
          event.attendeeFieldSchema,
          event.attendeeFieldSchemaMode ?? "extend"
        ),
        ...publicEligibilityFromEvent(event),
      },
      groupBookingOptions: group?.defaultBookingOptions ?? [],
      hotels: (
        await Promise.all(
          activeHotels.map(async (h) => {
            const pricing = normalizeHotelPricing(h.pricing)
            const packages = pricing.packages ?? []
            const mode = resolveAccommodationMode(pricing)
            const bookingCapacity =
              typeof h.bookingCapacity === "number" && h.bookingCapacity >= 0
                ? h.bookingCapacity
                : null

            const {
              countSoldPackageUnitsForHotel,
              withPackageRemainingUnits,
              filterAvailablePackages,
              countSoldAccommodationGuestsForHotel,
              remainingHotelBookingCapacity,
              isHotelPubliclyAvailable,
            } = await import("../lib/package-inventory")

            const soldGuests = bookingCapacity != null
              ? await countSoldAccommodationGuestsForHotel(h._id)
              : 0
            const remainingCapacity = remainingHotelBookingCapacity(bookingCapacity, soldGuests)

            const limitedPackages = packages.some(
              (pkg) => pkg.inventoryUnits != null && pkg.inventoryUnits >= 0
            )
            let packagesForPublic = packages
            if (limitedPackages) {
              const sold = await countSoldPackageUnitsForHotel(h._id, packages)
              packagesForPublic = withPackageRemainingUnits(packages, sold)
            } else {
              packagesForPublic = packages.map((pkg) => ({ ...pkg, remainingUnits: null }))
            }

            const availablePackages = filterAvailablePackages(packagesForPublic)
            if (
              !isHotelPubliclyAvailable({
                remainingCapacity,
                accommodationMode: mode,
                availablePackages,
                hadLimitedPackages: limitedPackages,
              })
            ) {
              return null
            }

            return {
              id: String(h._id),
              name: h.name,
              description: h.description,
              address: h.address,
              distanceFromVenueKm: h.distanceFromVenueKm ?? null,
              gallery: h.gallery,
              currency: normalizeTBookCurrency(h.currency),
              bookingCapacity,
              remainingCapacity,
              registrationFieldSchema: normalizeAttendeeFieldSchema(h.registrationFieldSchema ?? []),
              pricing: {
                ...pricing,
                packages: availablePackages,
              },
            }
          })
        )
      ).filter((hotel): hotel is NonNullable<typeof hotel> => hotel != null),
    }
  }

  // ---- Dashboard ----------------------------------------------------------

  static async getDashboardStats(organizationId?: string) {
    await dbConnect()
    const scope = orgFilter(organizationId)
    const now = new Date()
    const [groupCount, eventCount, upcomingEvents, bookingAgg, recentBookings] = await Promise.all([
      TBookEventGroup.countDocuments({ status: { $ne: "archived" }, ...scope }),
      TBookEvent.countDocuments({ status: "active", ...scope }),
      TBookEvent.countDocuments({ status: "active", startDate: { $gte: now }, ...scope }),
      TBookBooking.aggregate<{ _id: string; count: number; revenueHuf: number; guests: number }>([
        { $match: { status: { $in: ["paid", "confirmed"] }, ...scope } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
            revenueHuf: { $sum: "$totalHuf" },
            guests: { $sum: "$guests" },
          },
        },
      ]),
      TBookBooking.find({ status: { $in: ["paid", "confirmed", "pending"] }, ...scope })
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
    const pendingCount = await TBookBooking.countDocuments({ status: "pending", ...scope })

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

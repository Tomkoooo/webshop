/**
 * Live booking matrix against tbook-admin via booking service (no HTTP).
 * Cases are discovered from active events/hotels in the DB.
 *
 *   npm run tbook:backup-db
 *   TBOOK_ALLOW_LIVE_DB=1 npm run test:tbook:service
 */
import { config as loadEnv } from "dotenv"
import path from "node:path"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import mongoose from "mongoose"
import {
  PACKAGE_DEAL_SELECTION_KEY,
  ROOM_TYPE_SELECTION_KEY,
  resolveAccommodationMode,
} from "@wse/plugin-t-book/lib/hotel-pricing"
import type { TBookPublicEvent, TBookPublicHotel } from "@wse/plugin-t-book/storefront/tbook-public-api"
import {
  buildAttendeesForSchema,
  buildLiveMultiQuoteMatrix,
  buildLiveQuoteMatrix,
  type EventHotelBundle,
  type LiveMultiQuoteCase,
  type LiveQuoteCase,
} from "../helpers/t-book-live-matrix"

loadEnv({ path: path.resolve(process.cwd(), ".env") })

const allowLive = process.env.TBOOK_ALLOW_LIVE_DB === "1"
if (allowLive) {
  loadEnv({ path: path.resolve(process.cwd(), ".env"), override: true })
}

const liveUri = (process.env.TBOOK_LIVE_DATABASE_URL || process.env.DATABASE_URL || "").trim()
const runLive = allowLive && Boolean(liveUri)
const describeLive = runLive ? describe : describe.skip

function toPublicEvent(doc: Record<string, unknown>): TBookPublicEvent {
  return {
    id: String(doc._id),
    name: String(doc.name ?? ""),
    description: String(doc.description ?? ""),
    location: (doc.location as TBookPublicEvent["location"]) ?? { address: "" },
    startDate: String(doc.startDate ?? ""),
    endDate: String(doc.endDate ?? ""),
    nights: Number(doc.nights ?? 1),
    ticketFeeHuf: Number(doc.ticketFeeHuf ?? 0),
    ticketFeeMode: (doc.ticketFeeMode as TBookPublicEvent["ticketFeeMode"]) ?? "per_person",
    currency: typeof doc.currency === "string" ? doc.currency : undefined,
    registrationUnit: (doc.registrationUnit as TBookPublicEvent["registrationUnit"]) ?? "person",
    heroImage: String(doc.heroImage ?? ""),
    attendeeFieldSchema: Array.isArray(doc.attendeeFieldSchema)
      ? (doc.attendeeFieldSchema as TBookPublicEvent["attendeeFieldSchema"])
      : [],
  }
}

function toPublicHotel(doc: Record<string, unknown>): TBookPublicHotel {
  return {
    id: String(doc._id),
    name: String(doc.name ?? ""),
    description: String(doc.description ?? ""),
    address: String(doc.address ?? ""),
    gallery: Array.isArray(doc.gallery) ? (doc.gallery as string[]) : [],
    currency: typeof doc.currency === "string" ? doc.currency : undefined,
    distanceFromVenueKm: doc.distanceFromVenueKm as number | null | undefined,
    pricing: doc.pricing as TBookPublicHotel["pricing"],
    registrationFieldSchema: [],
  }
}

describeLive("t-book booking service matrix (discovered inventory)", () => {
  let bundles: EventHotelBundle[] = []
  let matrix: LiveQuoteCase[] = []
  let multiMatrix: LiveMultiQuoteCase[] = []

  beforeAll(async () => {
    process.env.DATABASE_URL = liveUri
    await mongoose.connect(liveUri)
    expect(mongoose.connection.name).toBe("tbook-admin")

    const eventsCol = mongoose.connection.collection("tbookevents")
    const hotelsCol = mongoose.connection.collection("tbookhotels")

    // Prefer the group with the most active events (EUR WDF inventory).
    const groups = await mongoose.connection
      .collection("tbookeventgroups")
      .find({ status: "active" })
      .toArray()
    let bestGroupId: mongoose.Types.ObjectId | null = null
    let bestCount = -1
    for (const group of groups) {
      const count = await eventsCol.countDocuments({ groupId: group._id, status: "active" })
      if (count > bestCount) {
        bestCount = count
        bestGroupId = group._id as mongoose.Types.ObjectId
      }
    }
    expect(bestGroupId, "no active group with events").toBeTruthy()

    const events = await eventsCol.find({ groupId: bestGroupId!, status: "active" }).toArray()
    expect(events.length).toBeGreaterThan(1)

    bundles = []
    for (const event of events) {
      const hotels = await hotelsCol
        .find({
          status: "active",
          $or: [{ groupId: event.groupId }, { eventId: event._id }],
        })
        .toArray()
      bundles.push({
        event: toPublicEvent(event as Record<string, unknown>),
        hotels: hotels.map((h) => toPublicHotel(h as Record<string, unknown>)),
      })
    }

    matrix = buildLiveQuoteMatrix(bundles)
    multiMatrix = buildLiveMultiQuoteMatrix(bundles)
    expect(matrix.length).toBeGreaterThan(0)
    expect(multiMatrix.length).toBeGreaterThan(0)
  }, 60000)

  afterAll(async () => {
    await mongoose.disconnect()
  })

  it("builds a matrix covering every event, hotel option, and lodging scope", () => {
    const eventIds = new Set(matrix.map((row) => row.eventId))
    expect(eventIds.size).toBe(bundles.length)
    expect(matrix.some((row) => row.lodgingScope === "full_group")).toBe(true)
    expect(matrix.some((row) => row.lodgingScope === "partial_group")).toBe(true)

    for (const { event, hotels } of bundles) {
      expect(matrix.some((row) => row.eventId === event.id && row.kind === "entry_only")).toBe(true)
      for (const hotel of hotels) {
        const mode = resolveAccommodationMode(hotel.pricing)
        if (mode === "packages" || mode === "both") {
          for (const pkg of hotel.pricing.packages ?? []) {
            expect(
              matrix.some(
                (row) =>
                  row.eventId === event.id &&
                  row.hotelId === hotel.id &&
                  row.lodgingScope === "full_group" &&
                  row.selections[PACKAGE_DEAL_SELECTION_KEY] === pkg.key
              ),
              `missing full package ${pkg.key} for ${event.name} / ${hotel.name}`
            ).toBe(true)
            expect(
              matrix.some(
                (row) =>
                  row.eventId === event.id &&
                  row.hotelId === hotel.id &&
                  row.lodgingScope === "partial_group" &&
                  row.selections[PACKAGE_DEAL_SELECTION_KEY] === pkg.key
              ),
              `missing partial package ${pkg.key} for ${event.name} / ${hotel.name}`
            ).toBe(true)
          }
        }
        if (mode === "room_nights" || mode === "both") {
          for (const room of hotel.pricing.roomTypes ?? []) {
            expect(
              matrix.some(
                (row) =>
                  row.eventId === event.id &&
                  row.hotelId === hotel.id &&
                  row.lodgingScope === "full_group" &&
                  row.selections[ROOM_TYPE_SELECTION_KEY] === room.key
              ),
              `missing full room ${room.key} for ${event.name} / ${hotel.name}`
            ).toBe(true)
          }
        }
      }
    }
  })

  it("quotes every discovered single-event matrix row", async () => {
    const { TBookBookingService } = await import("@wse/plugin-t-book/services/booking-service")
    let hotelQuoted = 0
    let partialQuoted = 0

    for (const row of matrix) {
      const result = await TBookBookingService.quote({
        eventId: row.eventId,
        guests: row.guests,
        accommodationGuests: row.accommodationGuests,
        hotelId: row.hotelId,
        nights: row.nights,
        selections: row.selections,
      })
      expect(result.quote.totalHuf, row.id).toBeGreaterThanOrEqual(0)
      expect(result.quote.lines.some((line) => line.key === "ticket"), row.id).toBe(true)
      expect(result.currency.toUpperCase()).toBe(row.currency.toUpperCase())
      if (row.kind !== "entry_only") {
        hotelQuoted += 1
        expect(result.hotelName).toBe(row.hotelName)
        expect(
          result.quote.lines.some(
            (line) => line.key === "accommodation_base" || line.key.startsWith("package")
          ),
          row.id
        ).toBe(true)
      }
      if (row.lodgingScope === "partial_group") {
        partialQuoted += 1
        expect(result.quote.accommodationGuests).toBe(1)
      }
    }

    expect(hotelQuoted, "expected hotel paths in matrix").toBeGreaterThan(0)
    expect(partialQuoted, "expected partial lodging paths").toBeGreaterThan(0)
  }, 600000)

  it("quotes multi-event combined and separate lodging matrices", async () => {
    const { TBookBookingService } = await import("@wse/plugin-t-book/services/booking-service")
    expect(multiMatrix.some((row) => row.kind === "multi_combined_hotel")).toBe(true)
    expect(multiMatrix.some((row) => row.kind === "multi_separate_hotels")).toBe(true)

    for (const row of multiMatrix) {
      const result = await TBookBookingService.quoteMulti({
        lodgingMode: row.lodgingMode,
        entries: row.entries,
        hotelId: row.hotelId,
        nights: row.nights,
        selections: row.selections,
        accommodationGuests: row.accommodationGuests,
      })
      expect(result.lodgingMode).toBe(row.lodgingMode)
      expect(result.entries.length).toBe(row.entries.length)
      expect(result.quote.totalHuf, row.id).toBeGreaterThan(0)

      if (row.lodgingMode === "combined" && row.hotelId) {
        expect(result.entries[0]?.quote.accommodationSubtotalHuf ?? 0).toBeGreaterThan(0)
        expect(result.entries.slice(1).every((entry) => entry.quote.accommodationSubtotalHuf === 0)).toBe(
          true
        )
      }
      if (row.kind === "multi_separate_hotels") {
        const hotelEntries = row.entries.filter((entry) => entry.hotelId)
        expect(hotelEntries.length).toBeGreaterThan(0)
      }
    }
  }, 300000)

  it("createPendingBooking entry-only leaves hotels/events counts unchanged", async () => {
    const { TBookBookingService } = await import("@wse/plugin-t-book/services/booking-service")
    const entry = matrix.find((row) => row.kind === "entry_only" && row.submitCandidate)
    expect(entry, "need a paid entry-only row").toBeTruthy()

    const quoted = await TBookBookingService.quote({
      eventId: entry!.eventId,
      guests: entry!.guests,
      hotelId: null,
      accommodationGuests: 0,
    })
    const attendees = buildAttendeesForSchema(entry!.guests, quoted.registrationFieldSchema)

    const beforeHotels = await mongoose.connection.collection("tbookhotels").countDocuments()
    const beforeEvents = await mongoose.connection.collection("tbookevents").countDocuments()

    const booking = await TBookBookingService.createPendingBooking({
      eventId: entry!.eventId,
      guests: entry!.guests,
      hotelId: null,
      accommodationGuests: 0,
      customer: {
        name: "Service Matrix Tester",
        email: "service-matrix@example.com",
        phone: "+36123456789",
        note: "Automated service matrix",
      },
      billing: {
        billingType: "personal",
        name: "Service Matrix Tester",
        zip: "1051",
        city: "Budapest",
        street: "Test Street 1",
        countryCode: "HU",
        taxNumber: "",
      },
      attendees,
    })

    expect(String(booking._id)).toBeTruthy()
    expect(String(booking.currency).toUpperCase()).toBe(entry!.currency.toUpperCase())
    expect(await mongoose.connection.collection("tbookhotels").countDocuments()).toBe(beforeHotels)
    expect(await mongoose.connection.collection("tbookevents").countDocuments()).toBe(beforeEvents)
  }, 60000)
})

if (!runLive) {
  describe.skip("t-book booking service matrix (skipped — set TBOOK_ALLOW_LIVE_DB=1)", () => {
    it("skipped", () => {
      expect(true).toBe(true)
    })
  })
}

/**
 * Live t-book booking matrix against a running site (tbook-admin).
 * Discovers events/hotels and covers:
 * - single-event entry-only / full-group hotel / partial-group hotel
 * - multi-event combined lodging (one shared hotel)
 * - multi-event separate lodging (per-event hotels)
 *
 *   npm run tbook:backup-db
 *   npm run tbook:ensure-api-key
 *   npm run tbook:dev:wdf
 *   TBOOK_LIVE_BASE_URL=http://localhost:3101 TBOOK_LIVE_SUBMIT=1 npm run test:tbook:live
 */
import { config as loadEnv } from "dotenv"
import path from "node:path"
import { beforeAll, describe, expect, it } from "vitest"
import {
  createBooking,
  createMultiBooking,
  getEventDetail,
  listEvents,
  quoteBooking,
  quoteMultiBooking,
  type TBookPublicHotel,
} from "@wse/plugin-t-book/storefront/tbook-public-api"
import {
  buildAttendeesForSchema,
  buildLiveMultiQuoteMatrix,
  buildLiveQuoteMatrix,
  pickMultiSubmitCases,
  pickSubmitCases,
  withRetry,
  type EventHotelBundle,
  type LiveMultiQuoteCase,
  type LiveQuoteCase,
} from "../helpers/t-book-live-matrix"

loadEnv({ path: path.resolve(process.cwd(), ".env"), override: true })

const baseUrl = process.env.TBOOK_LIVE_BASE_URL?.replace(/\/$/, "") ?? ""
const apiKey = process.env.NEXT_PUBLIC_TBOOK_TEST_API_KEY?.trim() ?? ""
const apiBase = baseUrl ? `${baseUrl}/api/plugins/t-book` : ""
const runLive = Boolean(baseUrl && apiKey)
const runSubmit = runLive && process.env.TBOOK_LIVE_SUBMIT === "1"

const describeLive = runLive ? describe : describe.skip

const customer = {
  name: "Live Matrix Tester",
  email: "tbook-matrix@example.com",
  phone: "+36123456789",
  note: "Automated live matrix — safe to ignore",
}

const billing = {
  billingType: "personal" as const,
  name: "Live Matrix Tester",
  zip: "1051",
  city: "Budapest",
  street: "Test Street 1",
  countryCode: "HU",
  taxNumber: "",
}

describeLive("t-book live booking API matrix (discovered inventory)", () => {
  let bundles: EventHotelBundle[] = []
  let matrix: LiveQuoteCase[] = []
  let multiMatrix: LiveMultiQuoteCase[] = []
  let quoted: Array<LiveQuoteCase & { total: number; lineKeys: string[]; accommodationGuestsQuoted?: number }> =
    []
  let multiQuoted: Array<LiveMultiQuoteCase & { total: number }> = []

  beforeAll(async () => {
    const listed = await withRetry("listEvents", () => listEvents(apiKey, apiBase))
    const events = listed.events ?? []
    expect(events.length, "API returned no active events for this API key / group").toBeGreaterThan(0)

    bundles = []
    for (const event of events) {
      const detail = await withRetry(`event:${event.id}`, () => getEventDetail(apiKey, event.id, apiBase))
      bundles.push({
        event: detail.event ?? event,
        hotels: (detail.hotels ?? []) as TBookPublicHotel[],
      })
    }

    matrix = buildLiveQuoteMatrix(bundles)
    multiMatrix = buildLiveMultiQuoteMatrix(bundles)
    expect(matrix.length, "matrix builder produced zero cases").toBeGreaterThan(0)
    expect(multiMatrix.length, "expected multi-event matrix with 2+ events").toBeGreaterThan(0)

    quoted = []
    for (const row of matrix) {
      const result = await withRetry(`quote:${row.id}`, () =>
        quoteBooking(
          apiKey,
          {
            eventId: row.eventId,
            guests: row.guests,
            accommodationGuests: row.accommodationGuests,
            hotelId: row.hotelId,
            nights: row.nights,
            selections: row.selections,
          },
          apiBase
        )
      )
      expect(result.ok, `quote failed for ${row.id}`).toBe(true)
      quoted.push({
        ...row,
        total: result.quote.totalHuf,
        lineKeys: result.quote.lines.map((line) => line.key),
        accommodationGuestsQuoted: result.quote.accommodationGuests,
      })
    }

    multiQuoted = []
    for (const row of multiMatrix) {
      const result = await withRetry(`multi-quote:${row.id}`, () =>
        quoteMultiBooking(
          apiKey,
          {
            lodgingMode: row.lodgingMode,
            entries: row.entries,
            hotelId: row.hotelId,
            nights: row.nights,
            selections: row.selections,
            accommodationGuests: row.accommodationGuests,
          },
          apiBase
        )
      )
      expect(result.ok, `multi quote failed for ${row.id}`).toBe(true)
      expect(result.lodgingMode).toBe(row.lodgingMode)
      expect(result.entries.length).toBe(row.entries.length)
      multiQuoted.push({ ...row, total: result.quote.totalHuf })
    }
  }, 900000)

  it("discovers multi-event EUR inventory with hotels", () => {
    expect(bundles.length).toBeGreaterThan(1)
    expect(bundles.some((b) => (b.event.currency || "").toUpperCase() === "EUR")).toBe(true)
    expect(bundles.some((b) => b.hotels.length > 0)).toBe(true)
  })

  it("covers full-group and partial-group hotel lodging on single events", () => {
    const full = quoted.filter((row) => row.lodgingScope === "full_group")
    const partial = quoted.filter((row) => row.lodgingScope === "partial_group")
    expect(full.length).toBeGreaterThan(0)
    expect(partial.length).toBeGreaterThan(0)

    for (const row of partial) {
      expect(row.guests).toBeGreaterThan(row.accommodationGuests ?? 0)
      expect(row.accommodationGuestsQuoted ?? row.accommodationGuests).toBe(1)
      const fullSibling = quoted.find(
        (candidate) =>
          candidate.lodgingScope === "full_group" &&
          candidate.eventId === row.eventId &&
          candidate.hotelId === row.hotelId &&
          JSON.stringify(candidate.selections) === JSON.stringify(row.selections)
      )
      if (fullSibling && row.kind === "room") {
        // Per-night rooms scale with accommodationGuests; packages are often sold per unit.
        expect(row.total, `${row.id} room partial should cost less than full-group`).toBeLessThan(
          fullSibling.total
        )
      }
      if (fullSibling && row.kind === "package") {
        expect(row.total, `${row.id} package partial should not exceed full-group`).toBeLessThanOrEqual(
          fullSibling.total
        )
      }
    }
  })

  it("quotes every single-event matrix row with coherent line items", () => {
    expect(quoted.length).toBe(matrix.length)
    for (const row of quoted) {
      expect(row.lineKeys.includes("ticket"), `${row.id} missing ticket line`).toBe(true)
      if (row.kind === "entry_only") {
        expect(row.lineKeys.some((k) => k === "accommodation_base" || k.startsWith("package"))).toBe(
          false
        )
      } else {
        expect(
          row.lineKeys.some((k) => k === "accommodation_base" || k.startsWith("package")),
          `${row.id} missing accommodation line`
        ).toBe(true)
        expect(row.total).toBeGreaterThan(0)
      }
    }
  })

  it("quotes multi-event combined and separate lodging modes", () => {
    expect(multiQuoted.some((row) => row.kind === "multi_entry_only")).toBe(true)
    expect(multiQuoted.some((row) => row.kind === "multi_combined_hotel")).toBe(true)
    expect(multiQuoted.some((row) => row.kind === "multi_separate_hotels")).toBe(true)

    for (const row of multiQuoted) {
      expect(row.total, row.id).toBeGreaterThan(0)
      if (row.kind === "multi_combined_hotel") {
        expect(row.lodgingMode).toBe("combined")
        expect(row.hotelId).toBeTruthy()
      }
      if (row.kind === "multi_separate_hotels") {
        expect(row.lodgingMode).toBe("separate")
        expect(row.entries.some((entry) => entry.hotelId)).toBe(true)
      }
    }
  })

  it("rejects unknown hotel id against a real event", async () => {
    const event = bundles[0]!.event
    await expect(
      quoteBooking(
        apiKey,
        {
          eventId: event.id,
          guests: 1,
          hotelId: "000000000000000000000000",
          nights: 1,
        },
        apiBase
      )
    ).rejects.toThrow(/Hotel not found|not found/i)
  })

  it.runIf(runSubmit)(
    "submits single-event samples (entry / full hotel / partial hotel) to Stripe",
    async () => {
      const samples = pickSubmitCases(quoted, 3)
      expect(samples.length).toBeGreaterThan(0)
      expect(samples.some((row) => row.lodgingScope === "partial_group") || samples.length >= 1).toBe(
        true
      )

      for (const row of samples) {
        const bundle = bundles.find((b) => b.event.id === row.eventId)
        const hotel = bundle?.hotels.find((h) => h.id === row.hotelId)
        const schema = [
          ...(bundle?.event.attendeeFieldSchema ?? []),
          ...(hotel?.registrationFieldSchema ?? []),
        ]
        const result = await withRetry(`submit:${row.id}`, () =>
          createBooking(
            apiKey,
            {
              eventId: row.eventId,
              guests: row.guests,
              accommodationGuests: row.accommodationGuests,
              hotelId: row.hotelId,
              nights: row.nights,
              selections: row.selections,
              customer,
              billing,
              attendees: buildAttendeesForSchema(row.guests, schema),
              returnBaseUrl: baseUrl,
            },
            apiBase
          )
        )
        expect(result.ok, `submit failed for ${row.id}`).toBe(true)
        expect(result.checkoutUrl).toMatch(/^https?:\/\//)
        expect(result.totalHuf).toBe(row.total)
      }
    },
    180000
  )

  it.runIf(runSubmit)(
    "submits multi-event samples (combined + separate lodging) to Stripe",
    async () => {
      const samples = pickMultiSubmitCases(multiQuoted, 3)
      expect(samples.length).toBeGreaterThan(0)

      for (const row of samples) {
        const entries = row.entries.map((entry) => {
          const bundle = bundles.find((b) => b.event.id === entry.eventId)
          const hotel = bundle?.hotels.find((h) => h.id === entry.hotelId)
          const schema = [
            ...(bundle?.event.attendeeFieldSchema ?? []),
            ...(hotel?.registrationFieldSchema ?? []),
          ]
          return {
            ...entry,
            attendees: buildAttendeesForSchema(entry.guests, schema),
          }
        })

        const result = await withRetry(`multi-submit:${row.id}`, () =>
          createMultiBooking(
            apiKey,
            {
              lodgingMode: row.lodgingMode,
              entries,
              hotelId: row.hotelId,
              nights: row.nights,
              selections: row.selections,
              accommodationGuests: row.accommodationGuests,
              customer,
              billing,
              returnBaseUrl: baseUrl,
            },
            apiBase
          )
        )
        expect(result.ok, `multi submit failed for ${row.id}`).toBe(true)
        expect(result.checkoutUrl).toMatch(/^https?:\/\//)
        expect(result.bookingIds?.length ?? 0).toBeGreaterThanOrEqual(2)
        expect(result.totalHuf).toBe(row.total)
      }
    },
    180000
  )
})

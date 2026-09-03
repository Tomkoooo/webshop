import "server-only"

import dbConnect from "@wse/core/lib/db"
import TBookBooking, { type TBookTDartsSyncEntry } from "../models/TBookBooking"
import TBookEvent from "../models/TBookEvent"
import TBookOrganization from "../models/TBookOrganization"
import { enrollTDartsPair, enrollTDartsPlayer, resolveTDartsCredentials } from "../lib/tdarts-client"
import { extractParticipantContact } from "../lib/tdarts-enroll-mapping"
import type { TBookAttendeeFieldDef, TBookAttendeeFieldValue } from "../lib/attendee-fields"

type BookingForSync = {
  _id: { toString(): string }
  eventId: { toString(): string }
  organizationId?: { toString(): string } | null
  guests: number
  totalHuf: number
  currency: string
  paidAt: Date | null
  customer: { name: string; email: string }
  attendees: {
    fields: Record<string, TBookAttendeeFieldValue>
    members?: { fields: Record<string, TBookAttendeeFieldValue> }[]
  }[]
  attendeeFieldSchema: TBookAttendeeFieldDef[]
  teamMemberFieldSchema: TBookAttendeeFieldDef[]
}

function entry(
  base: Pick<TBookTDartsSyncEntry, "participantKey" | "tournamentCode">,
  patch: Partial<TBookTDartsSyncEntry>
): TBookTDartsSyncEntry {
  return {
    playerId: null,
    rosterStatus: null,
    error: null,
    syncedAt: null,
    status: "pending",
    ...base,
    ...patch,
  }
}

/**
 * Enrolls a paid booking's participants into the linked tDarts tournament
 * roster (partner API — idempotent per participant). Best-effort: failures
 * are recorded per participant on `booking.tdartsSync` and never throw, so a
 * tDarts outage never blocks payment confirmation. Safe to call again (e.g.
 * an admin "retry sync" action) — tDarts' own idempotency on (clientId,
 * orderId) makes re-enrolling already-synced participants a no-op.
 *
 * Sync strategy depends on the event's registration unit:
 * - `person` (solo): one enroll call per attendee.
 * - `team` with exactly 2 roster slots (doubles/pairs): one pair-enroll call
 *   per ticket, registering both members as a single tDarts roster unit.
 * - `team` with more than 2 roster slots (e.g. a Champions-League-style
 *   squad tournament): tDarts' partner API does not model team rosters —
 *   these are marked `skipped` and are never sent to tDarts. Moderators
 *   manage those rosters directly on tdarts.hu; WDF can still show a
 *   read-only entry list sourced from the booking data itself (see
 *   `TBookEventService.getPublicEntryList`).
 */
export async function syncBookingToTDarts(bookingId: string): Promise<void> {
  await dbConnect()
  const booking = (await TBookBooking.findById(bookingId)) as (BookingForSync & { save?: never }) | null
  if (!booking) return

  const event = await TBookEvent.findById(booking.eventId)
    .select("tdarts registrationUnit teamMemberLimit")
    .lean()
  const tournamentCode = event?.tdarts?.enabled ? event.tdarts.tournamentCode : null
  if (!tournamentCode) return

  const org = booking.organizationId
    ? await TBookOrganization.findById(booking.organizationId).select("settings.tdarts").lean()
    : null
  const creds = resolveTDartsCredentials(org)
  if (!creds) {
    console.warn(
      `[t-book] tDarts sync skipped for booking ${bookingId} — organization has no tDarts partner credentials configured`
    )
    return
  }

  const isTeamEvent = event?.registrationUnit === "team"
  const isPairEvent = isTeamEvent && event?.teamMemberLimit === 2
  const attendees = booking.attendees ?? []
  const results: TBookTDartsSyncEntry[] = []
  const attendeeFieldSchema = booking.attendeeFieldSchema
  const teamMemberFieldSchema = booking.teamMemberFieldSchema
  const customer = booking.customer
  const totalHuf = booking.totalHuf
  const currency = booking.currency
  const paidAt = booking.paidAt
  const guests = booking.guests

  async function syncSoloParticipant(key: string, fields: Record<string, TBookAttendeeFieldValue> | undefined) {
    const contact = extractParticipantContact(attendeeFieldSchema, fields, {
      name: customer.name,
      email: customer.email,
    })
    const orderId = `${bookingId}:${key}`
    try {
      const enrolled = await enrollTDartsPlayer(creds!, {
        tournamentCode: tournamentCode!,
        email: contact.email,
        name: contact.name,
        country: contact.country,
        birthDate: contact.birthDate,
        orderId,
        amount: totalHuf,
        currency: currency,
        paidAt: paidAt?.toISOString(),
      })
      results.push(
        entry(
          { participantKey: key, tournamentCode: tournamentCode! },
          {
            status: enrolled.rosterStatus === "waiting" ? "waiting" : "synced",
            playerId: enrolled.playerId,
            rosterStatus: enrolled.rosterStatus,
            syncedAt: new Date(),
          }
        )
      )
    } catch (error) {
      results.push(
        entry(
          { participantKey: key, tournamentCode: tournamentCode! },
          { status: "failed", error: error instanceof Error ? error.message : "tDarts enroll failed" }
        )
      )
      console.error(`[t-book] tDarts enroll failed for booking ${bookingId} participant ${key}`, error)
    }
  }

  async function syncPairTicket(
    key: string,
    members: { fields: Record<string, TBookAttendeeFieldValue> }[]
  ) {
    if (members.length !== 2) {
      results.push(
        entry(
          { participantKey: key, tournamentCode: tournamentCode! },
          {
            status: "failed",
            error: `Expected exactly 2 team members for a pair ticket, got ${members.length}`,
          }
        )
      )
      return
    }
    const [c1, c2] = members.map((m) =>
      extractParticipantContact(teamMemberFieldSchema, m.fields, {
        name: customer.name,
        email: customer.email,
      })
    ) as [ReturnType<typeof extractParticipantContact>, ReturnType<typeof extractParticipantContact>]
    const orderId = `${bookingId}:${key}`
    try {
      const enrolled = await enrollTDartsPair(creds!, {
        tournamentCode: tournamentCode!,
        member1: { email: c1.email, name: c1.name, country: c1.country, birthDate: c1.birthDate },
        member2: { email: c2.email, name: c2.name, country: c2.country, birthDate: c2.birthDate },
        orderId,
        amount: totalHuf,
        currency: currency,
        paidAt: paidAt?.toISOString(),
      })
      results.push(
        entry(
          { participantKey: key, tournamentCode: tournamentCode! },
          {
            status: enrolled.rosterStatus === "waiting" ? "waiting" : "synced",
            playerId: enrolled.pairPlayerId,
            rosterStatus: enrolled.rosterStatus,
            syncedAt: new Date(),
          }
        )
      )
    } catch (error) {
      results.push(
        entry(
          { participantKey: key, tournamentCode: tournamentCode! },
          { status: "failed", error: error instanceof Error ? error.message : "tDarts pair enroll failed" }
        )
      )
      console.error(`[t-book] tDarts pair enroll failed for booking ${bookingId} ticket ${key}`, error)
    }
  }

  if (attendees.length === 0) {
    // No attendee schema configured on the event — one buyer-attributed entry,
    // only safe to sync when the whole booking is a single ticket.
    if (!isTeamEvent && guests === 1) {
      await syncSoloParticipant("0", undefined)
    }
  } else if (isTeamEvent && !isPairEvent) {
    // Real team roster (3+ members, e.g. a league squad) — tDarts' partner
    // API has no team-roster concept. Moderators manage these rosters
    // directly on tdarts.hu; skip rather than mis-enroll members individually.
    attendees.forEach((_, ai) => {
      results.push(
        entry(
          { participantKey: `${ai}`, tournamentCode: tournamentCode! },
          {
            status: "skipped",
            error:
              "Team tournaments with more than 2 roster slots are not auto-synced to tDarts — managed directly on tdarts.hu.",
          }
        )
      )
    })
  } else if (isPairEvent) {
    await Promise.all(attendees.map((attendee, ai) => syncPairTicket(`${ai}`, attendee.members ?? [])))
  } else {
    await Promise.all(attendees.map((attendee, ai) => syncSoloParticipant(`${ai}`, attendee.fields)))
  }

  if (results.length > 0) {
    await TBookBooking.updateOne({ _id: bookingId }, { $set: { tdartsSync: results } })
  }
}

export type TDartsBackfillSummary = {
  total: number
  synced: number
  waiting: number
  failed: number
  skipped: number
}

/**
 * Backfills tDarts sync for every already-paid/confirmed booking of an
 * event — for turning tDarts sync on after bookings already exist (see
 * `syncBookingToTDarts` for per-booking semantics). Runs sequentially to
 * stay well under tDarts' partner rate limit.
 */
export async function syncAllPaidBookingsForEvent(eventId: string): Promise<TDartsBackfillSummary> {
  await dbConnect()
  const bookings = await TBookBooking.find({
    eventId,
    status: { $in: ["paid", "confirmed"] },
  })
    .select("_id")
    .lean()

  const summary: TDartsBackfillSummary = { total: bookings.length, synced: 0, waiting: 0, failed: 0, skipped: 0 }

  for (const booking of bookings) {
    await syncBookingToTDarts(String(booking._id))
    const refreshed = await TBookBooking.findById(booking._id).select("tdartsSync").lean()
    for (const row of refreshed?.tdartsSync ?? []) {
      if (row.status === "synced") summary.synced += 1
      else if (row.status === "waiting") summary.waiting += 1
      else if (row.status === "failed") summary.failed += 1
      else if (row.status === "skipped") summary.skipped += 1
    }
  }

  return summary
}

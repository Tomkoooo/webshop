import type { TBookAttendeeFieldDef } from "./attendee-fields"
import type { TBookRegistrationUnit } from "./registration-fields"

export type HeadcountEventLike = {
  registrationUnit?: TBookRegistrationUnit
  playersPerTicket?: number | null
  teamMemberLimit?: number | null
  teamMemberFieldSchema?: TBookAttendeeFieldDef[]
  attendeeFieldSchema?: TBookAttendeeFieldDef[]
}

/**
 * Fixed players per ticket/entry.
 * - Explicit `playersPerTicket` > 1 → fixed roster (e.g. pair = 2)
 * - `playersPerTicket` = 1 (default) → not a fixed multi-player ticket
 * - Does NOT use `teamMemberLimit` (that is a flexible max for team events)
 */
export function resolvePlayersPerTicket(event: HeadcountEventLike): number {
  const explicit = event.playersPerTicket
  if (explicit != null && Number.isFinite(explicit) && explicit >= 1) {
    return Math.max(1, Math.min(100, Math.floor(explicit)))
  }
  return 1
}

/** True when the event requires an exact player count per entry (playersPerTicket > 1). */
export function usesFixedPlayerRoster(event: HeadcountEventLike): boolean {
  return resolvePlayersPerTicket(event) > 1
}

/**
 * Exact roster size when fixed; `null` means flexible team roster
 * (add/remove members up to `teamMemberLimit`).
 */
export function playerRosterSize(event: HeadcountEventLike): number | null {
  if (usesFixedPlayerRoster(event)) return resolvePlayersPerTicket(event)
  return null
}

/** How many empty member slots to create on the booking form. */
export function initialPlayerMemberCount(event: HeadcountEventLike): number {
  if (usesFixedPlayerRoster(event)) return resolvePlayersPerTicket(event)
  if (needsPlayerMemberForms(event)) return 1
  return 0
}

/**
 * Maximum hotel / package headcount allowed for this booking.
 * Fixed multi-player tickets use playersPerTicket; flexible teams use teamMemberLimit
 * as a ceiling only — billed guests come from `countRosterPlayers`.
 */
export function accommodationGuestCount(ticketCount: number, event: HeadcountEventLike): number {
  const tickets = Math.max(1, Math.floor(ticketCount || 1))
  if (usesFixedPlayerRoster(event)) {
    return tickets * resolvePlayersPerTicket(event)
  }
  if ((event.registrationUnit ?? "person") === "team" && event.teamMemberLimit != null) {
    const limit = Math.max(1, Math.min(100, Math.floor(event.teamMemberLimit)))
    return tickets * limit
  }
  return tickets
}

export type RosterAttendeeLike = {
  members?: unknown[] | null
}

/**
 * Actual (or currently planned) player count.
 * Flexible team events use roster slots, never `teamMemberLimit`.
 * Missing roster falls back to one player per team/entry.
 */
export function countRosterPlayers(
  attendees: RosterAttendeeLike[] | null | undefined,
  event: HeadcountEventLike,
  ticketCount: number
): number {
  const tickets = Math.max(1, Math.floor(ticketCount || 1))
  const max = accommodationGuestCount(tickets, event)
  if (usesFixedPlayerRoster(event)) {
    return Math.min(tickets * resolvePlayersPerTicket(event), max)
  }

  if ((event.registrationUnit ?? "person") !== "team") {
    return Math.min(tickets, max)
  }

  const rows = attendees ?? []
  if (rows.length === 0) {
    return Math.min(tickets * Math.max(1, initialPlayerMemberCount(event) || 1), max)
  }

  let total = 0
  for (const row of rows) {
    const n = Array.isArray(row.members) ? row.members.length : 0
    total += Math.max(1, n)
  }
  return Math.min(Math.max(1, total), max)
}

/** Hotel headcount for the stay choice: "all" follows the roster, not the ceiling. */
export function resolveStayGuestCount(input: {
  accommodationNeed: "all" | "some" | "none"
  override?: number
  rosterPlayers: number
  maxGuests: number
}): number {
  if (input.accommodationNeed === "none") return 0
  const max = Math.max(1, Math.floor(input.maxGuests || 1))
  if (input.accommodationNeed === "some") {
    return Math.min(Math.max(1, Math.floor(input.override || 1)), max)
  }
  return Math.min(Math.max(1, Math.floor(input.rosterPlayers || 1)), max)
}

/** Schema for each player slot (members array). */
export function playerFieldSchema(event: HeadcountEventLike): TBookAttendeeFieldDef[] {
  return event.teamMemberFieldSchema ?? []
}

export function needsPlayerMemberForms(event: HeadcountEventLike): boolean {
  if (usesFixedPlayerRoster(event)) {
    return playerFieldSchema(event).length > 0
  }
  return (
    (event.registrationUnit ?? "person") === "team" &&
    (event.teamMemberFieldSchema?.length ?? 0) > 0
  )
}

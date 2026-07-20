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
 * Hotel / package planning headcount.
 * Fixed multi-player tickets use playersPerTicket; flexible teams use teamMemberLimit
 * as the planning ceiling (guests can lower accommodation headcount on the form).
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

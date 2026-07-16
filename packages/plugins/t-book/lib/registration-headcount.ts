import type { TBookAttendeeFieldDef } from "./attendee-fields"
import type { TBookRegistrationUnit } from "./registration-fields"

export type HeadcountEventLike = {
  registrationUnit?: TBookRegistrationUnit
  playersPerTicket?: number | null
  teamMemberLimit?: number | null
  teamMemberFieldSchema?: TBookAttendeeFieldDef[]
  attendeeFieldSchema?: TBookAttendeeFieldDef[]
}

/** Fixed player roster size per ticket/team (default 1). */
export function resolvePlayersPerTicket(event: HeadcountEventLike): number {
  const n = event.playersPerTicket ?? 1
  return Math.max(1, Math.min(100, Math.floor(n)))
}

/** Ticket count × players per ticket — used for hotel/package capacity. */
export function accommodationGuestCount(ticketCount: number, event: HeadcountEventLike): number {
  const tickets = Math.max(1, Math.floor(ticketCount || 1))
  return tickets * resolvePlayersPerTicket(event)
}

/** Player-level fields are collected per ticket when roster size > 1. */
export function usesFixedPlayerRoster(event: HeadcountEventLike): boolean {
  return resolvePlayersPerTicket(event) > 1
}

/** Schema for each player slot (members array). */
export function playerFieldSchema(event: HeadcountEventLike): TBookAttendeeFieldDef[] {
  return event.teamMemberFieldSchema ?? []
}

export function needsPlayerMemberForms(event: HeadcountEventLike): boolean {
  if (!usesFixedPlayerRoster(event)) {
    return (
      (event.registrationUnit ?? "person") === "team" &&
      (event.teamMemberFieldSchema?.length ?? 0) > 0
    )
  }
  return playerFieldSchema(event).length > 0
}

export function playerRosterSize(event: HeadcountEventLike): number | null {
  if (usesFixedPlayerRoster(event)) return resolvePlayersPerTicket(event)
  if ((event.registrationUnit ?? "person") === "team") return event.teamMemberLimit ?? null
  return null
}

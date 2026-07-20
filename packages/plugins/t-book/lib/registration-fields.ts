import type { TBookAttendeeFieldDef } from "./attendee-fields"
import { normalizeAttendeeFieldSchema } from "./attendee-fields"

export type TBookRegistrationFieldsMode = "extend" | "replace"

export const REGISTRATION_FIELDS_MODE_LABELS: Record<TBookRegistrationFieldsMode, string> = {
  extend: "Kiegészíti a csoport mezőit",
  replace: "Felülírja a csoport mezőit",
}

/** Merge event + hotel registration field schemas (hotel keys must not duplicate event keys). */
export function mergeRegistrationFieldSchemas(
  ...schemas: Array<TBookAttendeeFieldDef[] | undefined | null>
): TBookAttendeeFieldDef[] {
  const merged: TBookAttendeeFieldDef[] = []
  const keys = new Set<string>()
  for (const schema of schemas) {
    for (const field of normalizeAttendeeFieldSchema(schema)) {
      if (keys.has(field.key)) continue
      keys.add(field.key)
      merged.push(field)
    }
  }
  return merged
}

/**
 * Resolve event registration fields from group defaults and event overrides.
 * - extend: group base + event fields; same key on event replaces the group field
 * - replace: only event fields (group defaults ignored)
 */
export function resolveEventAttendeeFieldSchema(
  groupSchema: TBookAttendeeFieldDef[] | undefined | null,
  eventSchema: TBookAttendeeFieldDef[] | undefined | null,
  mode: TBookRegistrationFieldsMode = "extend"
): TBookAttendeeFieldDef[] {
  const eventFields = normalizeAttendeeFieldSchema(eventSchema)
  if (mode === "replace") return eventFields

  const groupFields = normalizeAttendeeFieldSchema(groupSchema)
  const byKey = new Map<string, TBookAttendeeFieldDef>()
  for (const field of groupFields) byKey.set(field.key, field)
  for (const field of eventFields) byKey.set(field.key, field)

  const ordered: TBookAttendeeFieldDef[] = []
  const seen = new Set<string>()
  for (const field of groupFields) {
    const resolved = byKey.get(field.key)
    if (!resolved || seen.has(field.key)) continue
    ordered.push(resolved)
    seen.add(field.key)
  }
  for (const field of eventFields) {
    if (seen.has(field.key)) continue
    ordered.push(field)
    seen.add(field.key)
  }
  return ordered
}

/**
 * Team / multi-player member fields.
 * For team events: prefer explicit team-member schema; if empty, use the group
 * default form (and event ticket-field overrides) as per-member fields.
 */
export function resolveTeamMemberFieldSchema(opts: {
  registrationUnit?: TBookRegistrationUnit
  groupSchema?: TBookAttendeeFieldDef[] | null
  eventTeamMemberSchema?: TBookAttendeeFieldDef[] | null
  eventTicketSchema?: TBookAttendeeFieldDef[] | null
  mode?: TBookRegistrationFieldsMode
}): TBookAttendeeFieldDef[] {
  const unit = opts.registrationUnit ?? "person"
  const explicit = normalizeAttendeeFieldSchema(opts.eventTeamMemberSchema)
  if (explicit.length > 0) {
    return unit === "team"
      ? resolveEventAttendeeFieldSchema(opts.groupSchema, explicit, opts.mode ?? "extend")
      : explicit
  }
  if (unit === "team") {
    return resolveEventAttendeeFieldSchema(
      opts.groupSchema,
      opts.eventTicketSchema,
      opts.mode ?? "extend"
    )
  }
  return []
}

/** Ticket-level fields shown once per entry. Empty for team events (member form only). */
export function resolveTicketAttendeeFieldSchema(opts: {
  registrationUnit?: TBookRegistrationUnit
  groupSchema?: TBookAttendeeFieldDef[] | null
  eventSchema?: TBookAttendeeFieldDef[] | null
  mode?: TBookRegistrationFieldsMode
}): TBookAttendeeFieldDef[] {
  if ((opts.registrationUnit ?? "person") === "team") return []
  return resolveEventAttendeeFieldSchema(
    opts.groupSchema,
    opts.eventSchema,
    opts.mode ?? "extend"
  )
}

export type TBookRegistrationUnit = "person" | "team"

export function registrationUnitLabel(unit: TBookRegistrationUnit, count = 1): string {
  if (unit === "team") return count === 1 ? "team" : "teams"
  return count === 1 ? "person" : "people"
}

export function ticketFeeModeLabel(
  mode: "per_person" | "per_booking" | "per_team",
  unit: TBookRegistrationUnit = "person"
): string {
  switch (mode) {
    case "per_booking":
      return "per booking"
    case "per_team":
      return "per team"
    case "per_person":
    default:
      return unit === "team" ? "per team" : "per person / entry"
  }
}

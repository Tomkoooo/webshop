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

export type TBookRegistrationUnit = "person" | "team"

export function registrationUnitLabel(unit: TBookRegistrationUnit, count = 1): string {
  if (unit === "team") return count === 1 ? "csapat" : "csapat"
  return count === 1 ? "fő" : "fő"
}

export function ticketFeeModeLabel(
  mode: "per_person" | "per_booking" | "per_team",
  unit: TBookRegistrationUnit = "person"
): string {
  switch (mode) {
    case "per_booking":
      return "foglalásonként"
    case "per_team":
      return "csapatonként"
    case "per_person":
    default:
      return unit === "team" ? "csapatonként" : "fő / jegy"
  }
}

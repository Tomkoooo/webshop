import type { TBookAttendeeFieldDef } from "./attendee-fields"
import { normalizeAttendeeFieldSchema } from "./attendee-fields"

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

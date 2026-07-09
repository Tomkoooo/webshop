import { describe, expect, it } from "vitest"
import {
  normalizeAttendeePayload,
  tournamentAttendeeFieldPreset,
  validateAttendees,
} from "@wse/plugin-t-book/lib/attendee-fields"

describe("attendee fields", () => {
  const schema = tournamentAttendeeFieldPreset()

  it("requires one row per guest when schema is configured", () => {
    const issues = validateAttendees(schema, 2, [{ fields: {} }])
    expect(issues.some((issue) => issue.index === -1)).toBe(true)
  })

  it("validates required fields per attendee", () => {
    const issues = validateAttendees(schema, 1, [
      {
        fields: {
          [schema[0].key]: "Nagy Béla",
          [schema[1].key]: "not-an-email",
        },
      },
    ])
    expect(issues.some((issue) => issue.message.includes("e-mail"))).toBe(true)
  })

  it("normalizes attendee payload values", () => {
    const attendees = normalizeAttendeePayload(schema, [
      {
        fields: {
          [schema[0].key]: "  Anna  ",
          [schema[2].key]: "1998",
        },
      },
    ])
    expect(attendees[0].fields[schema[0].key]).toBe("Anna")
    expect(attendees[0].fields[schema[2].key]).toBe(1998)
  })
})

import { describe, expect, it } from "vitest"
import {
  resolveTeamMemberFieldSchema,
  resolveTicketAttendeeFieldSchema,
} from "../../packages/plugins/t-book/lib/registration-fields"
import type { TBookAttendeeFieldDef } from "../../packages/plugins/t-book/lib/attendee-fields"

const groupFields: TBookAttendeeFieldDef[] = [
  { key: "full_name", label: "Name", type: "text", required: true },
  { key: "gender", label: "Gender", type: "select", required: true },
]

const eventTicketExtra: TBookAttendeeFieldDef[] = [
  { key: "club", label: "Club", type: "text" },
]

const explicitMembers: TBookAttendeeFieldDef[] = [
  { key: "player_name", label: "Player", type: "text", required: true },
]

describe("team registration field resolution", () => {
  it("skips ticket-level fields for team events", () => {
    expect(
      resolveTicketAttendeeFieldSchema({
        registrationUnit: "team",
        groupSchema: groupFields,
        eventSchema: eventTicketExtra,
      })
    ).toEqual([])
  })

  it("keeps ticket-level fields for person events", () => {
    const fields = resolveTicketAttendeeFieldSchema({
      registrationUnit: "person",
      groupSchema: groupFields,
      eventSchema: eventTicketExtra,
    })
    expect(fields.map((f) => f.key)).toEqual(["full_name", "gender", "club"])
  })

  it("defaults team member fields to the group form when event members are empty", () => {
    const fields = resolveTeamMemberFieldSchema({
      registrationUnit: "team",
      groupSchema: groupFields,
      eventTeamMemberSchema: [],
      eventTicketSchema: eventTicketExtra,
    })
    expect(fields.map((f) => f.key)).toEqual(["full_name", "gender", "club"])
  })

  it("uses explicit team member schema when set", () => {
    const fields = resolveTeamMemberFieldSchema({
      registrationUnit: "team",
      groupSchema: groupFields,
      eventTeamMemberSchema: explicitMembers,
      eventTicketSchema: eventTicketExtra,
    })
    expect(fields.map((f) => f.key)).toEqual(["full_name", "gender", "player_name"])
  })
})

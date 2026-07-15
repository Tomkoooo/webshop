import { describe, expect, it } from "vitest"
import {
  mergeRegistrationFieldSchemas,
  resolveEventAttendeeFieldSchema,
} from "@wse/plugin-t-book/lib/registration-fields"
import type { TBookAttendeeFieldDef } from "@wse/plugin-t-book/lib/attendee-fields"

const field = (
  key: string,
  label = key,
  overrides: Partial<TBookAttendeeFieldDef> = {}
): TBookAttendeeFieldDef => ({
  key,
  label,
  type: "text",
  ...overrides,
})

describe("resolveEventAttendeeFieldSchema", () => {
  const groupFields = [
    field("name", "Név", { required: true }),
    field("email", "E-mail", { type: "email" }),
  ]
  const eventFields = [field("email", "E-mail cím", { type: "email" }), field("phone", "Telefon")]

  it("extends group fields with event fields and overrides same keys", () => {
    const resolved = resolveEventAttendeeFieldSchema(groupFields, eventFields, "extend")
    expect(resolved.map((f) => f.key)).toEqual(["name", "email", "phone"])
    expect(resolved.find((f) => f.key === "email")?.label).toBe("E-mail cím")
  })

  it("replaces group fields when mode is replace", () => {
    const resolved = resolveEventAttendeeFieldSchema(groupFields, eventFields, "replace")
    expect(resolved.map((f) => f.key)).toEqual(["email", "phone"])
  })

  it("returns only group fields when event schema is empty in extend mode", () => {
    const resolved = resolveEventAttendeeFieldSchema(groupFields, [], "extend")
    expect(resolved.map((f) => f.key)).toEqual(["name", "email"])
  })
})

describe("mergeRegistrationFieldSchemas", () => {
  it("merges event and hotel fields without duplicate keys", () => {
    const merged = mergeRegistrationFieldSchemas(
      [field("name")],
      [field("name"), field("room_preference")]
    )
    expect(merged.map((f) => f.key)).toEqual(["name", "room_preference"])
  })
})

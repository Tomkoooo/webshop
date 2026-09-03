import { describe, expect, it } from "vitest"
import { extractParticipantContact } from "@wse/plugin-t-book/lib/tdarts-enroll-mapping"
import { tournamentAttendeeFieldPreset } from "@wse/plugin-t-book/lib/attendee-fields"

describe("extractParticipantContact", () => {
  const schema = tournamentAttendeeFieldPreset()
  const [nameField, emailField, , countryField] = schema

  it("reads email/name/country from the matching field types", () => {
    const contact = extractParticipantContact(
      schema,
      {
        [nameField.key]: "Kovács Béla",
        [emailField.key]: "bela@example.com",
        [countryField.key]: countryField.choices?.[0]?.value ?? "",
      },
      { name: "Buyer Name", email: "buyer@example.com" }
    )
    expect(contact.email).toBe("bela@example.com")
    expect(contact.name).toBe("Kovács Béla")
    expect(contact.country).toBe("HU")
  })

  it("falls back to the booking buyer's contact when fields are missing", () => {
    const contact = extractParticipantContact(schema, undefined, {
      name: "Buyer Name",
      email: "buyer@example.com",
    })
    expect(contact.email).toBe("buyer@example.com")
    expect(contact.name).toBe("Buyer Name")
    expect(contact.country).toBeUndefined()
  })

  it("omits country rather than guessing when the label isn't a known country", () => {
    const contact = extractParticipantContact(
      schema,
      {
        [nameField.key]: "Jane Doe",
        [emailField.key]: "jane@example.com",
        [countryField.key]: countryField.choices?.[5]?.value ?? "", // "Egyéb" (Other)
      },
      { name: "Buyer", email: "buyer@example.com" }
    )
    expect(contact.country).toBeUndefined()
  })

  it("has no schema fields for a schema-less event", () => {
    const contact = extractParticipantContact([], undefined, {
      name: "Solo Buyer",
      email: "solo@example.com",
    })
    expect(contact).toEqual({
      email: "solo@example.com",
      name: "Solo Buyer",
      country: undefined,
      birthDate: undefined,
    })
  })
})

describe("extractParticipantContact — real-world free-text nationality + gender schema", () => {
  // Mirrors the actual World Darts Festival group schema in production: a
  // free-text nationality field (not the recommended select preset) and a
  // gender select field that must NOT be mistaken for country.
  const schema = [
    { key: "teljes_nev", label: "Full Name", type: "text" as const, required: true, sortOrder: 0 },
    { key: "e_mail", label: "E-mail", type: "email" as const, required: true, sortOrder: 1 },
    { key: "szuletesi_ev", label: "Dat of Birth", type: "date" as const, required: true, sortOrder: 2 },
    { key: "allampolgarsag", label: "Nationality", type: "text" as const, required: true, sortOrder: 3 },
    {
      key: "field_5",
      label: "Gender",
      type: "select" as const,
      required: true,
      choices: [
        { value: "option_1", label: "Male" },
        { value: "option_2", label: "Female" },
      ],
      sortOrder: 4,
    },
  ]

  const fallback = { name: "Buyer", email: "buyer@example.com" }

  it("reads the free-text nationality field, not the gender select", () => {
    const contact = extractParticipantContact(
      schema,
      {
        teljes_nev: "Ralf Huesmann",
        e_mail: "ralfhuesmann@yahoo.de",
        szuletesi_ev: "1971-06-13",
        allampolgarsag: "Germany",
        field_5: "option_1",
      },
      fallback
    )
    expect(contact.name).toBe("Ralf Huesmann")
    expect(contact.email).toBe("ralfhuesmann@yahoo.de")
    expect(contact.country).toBe("DE")
    expect(contact.birthDate).toBe("1971-06-13")
  })

  it.each([
    ["danish", "DK"],
    ["Hungarian", "HU"],
    ["Northern Ireland", "GB"],
    ["Northern ireland", "GB"],
    ["Malta", "MT"],
    ["Slovakia", "SK"],
  ])("normalizes messy real-world nationality value %s -> %s", (raw, iso2) => {
    const contact = extractParticipantContact(
      schema,
      { teljes_nev: "Test Player", e_mail: "t@example.com", allampolgarsag: raw },
      fallback
    )
    expect(contact.country).toBe(iso2)
  })

  it("omits country for an unrecognized nationality rather than guessing", () => {
    const contact = extractParticipantContact(
      schema,
      { teljes_nev: "Test Player", e_mail: "t@example.com", allampolgarsag: "Atlantis" },
      fallback
    )
    expect(contact.country).toBeUndefined()
  })
})

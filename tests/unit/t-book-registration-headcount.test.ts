import { describe, expect, it } from "vitest"
import {
  accommodationGuestCount,
  needsPlayerMemberForms,
  resolvePlayersPerTicket,
} from "@wse/plugin-t-book/lib/registration-headcount"
import { validateEligibility } from "@wse/plugin-t-book/lib/eligibility"

describe("registration-headcount", () => {
  it("computes accommodation guests for pair tickets", () => {
    expect(
      accommodationGuestCount(1, { playersPerTicket: 2, registrationUnit: "person" })
    ).toBe(2)
    expect(
      accommodationGuestCount(3, { playersPerTicket: 2, registrationUnit: "person" })
    ).toBe(6)
  })

  it("uses teamMemberLimit as team size for hotel headcount", () => {
    expect(
      accommodationGuestCount(2, {
        registrationUnit: "team",
        teamMemberLimit: 5,
        playersPerTicket: 1,
      })
    ).toBe(10)
  })

  it("requires player member forms when roster > 1", () => {
    expect(
      needsPlayerMemberForms({
        registrationUnit: "person",
        playersPerTicket: 2,
        teamMemberFieldSchema: [{ key: "name", label: "Név", type: "text" }],
      })
    ).toBe(true)
    expect(resolvePlayersPerTicket({ playersPerTicket: 0 })).toBe(1)
  })
})

describe("validateEligibility", () => {
  const playerSchema = [
    { key: "birth_date", label: "Születési dátum", type: "date" as const, required: true },
    {
      key: "category",
      label: "Kategória",
      type: "select" as const,
      required: true,
      choices: [
        { value: "junior", label: "Junior" },
        { value: "open", label: "Open" },
      ],
    },
  ]

  it("blocks over max age for custom age rule", () => {
    const issues = validateEligibility(
      {
        eligibilityPreset: "custom",
        eligibilityMaxAge: 17,
        eligibilityGenderFieldKey: "category",
        startDate: "2026-08-01",
      },
      [
        {
          fields: {},
          members: [{ fields: { birth_date: "2000-01-01", category: "junior" } }],
        },
      ],
      [],
      playerSchema,
      1
    )
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.message).toMatch(/maximum age is 17/i)
  })

  it("accepts female aliases against allowed female when choice value is slug", () => {
    const genderSchema = [
      {
        key: "nem",
        label: "Nem",
        type: "select" as const,
        required: true,
        choices: [
          { value: "no", label: "Nő" },
          { value: "ferfi", label: "Férfi" },
        ],
      },
    ]
    const issues = validateEligibility(
      {
        eligibilityPreset: "custom",
        eligibilityAllowedGenders: ["female"],
        eligibilityGenderFieldKey: "nem",
        startDate: "2026-08-01",
      },
      [{ fields: { nem: "no" } }],
      genderSchema,
      [],
      null
    )
    expect(issues).toHaveLength(0)
  })

  it("allows matching custom allowed field values", () => {
    const issues = validateEligibility(
      {
        eligibilityPreset: "custom",
        eligibilityMinAge: 18,
        eligibilityAllowedGenders: ["junior", "open"],
        eligibilityGenderFieldKey: "category",
        startDate: "2026-08-01",
      },
      [
        {
          fields: {},
          members: [{ fields: { birth_date: "1990-05-01", category: "open" } }],
        },
      ],
      [],
      playerSchema,
      1
    )
    expect(issues).toHaveLength(0)
  })

  it("enforces organizer form_rules without hardcoded sport presets", () => {
    const issues = validateEligibility(
      {
        eligibilityPreset: "form_rules",
        eligibilityFormRules: {
          logic: "and",
          rules: [
            {
              id: "r1",
              fieldKey: "category",
              op: "equals",
              value: "junior",
              message: "Csak junior kategória",
            },
            {
              id: "r2",
              fieldKey: "birth_date",
              op: "max_age",
              value: "17",
            },
          ],
        },
        startDate: "2026-08-01",
      },
      [
        {
          fields: {},
          members: [{ fields: { birth_date: "2012-01-01", category: "open" } }],
        },
      ],
      [],
      playerSchema,
      1
    )
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.message).toMatch(/junior/i)
  })

  it("still resolves legacy under18 preset for existing events", () => {
    const issues = validateEligibility(
      { eligibilityPreset: "under18", startDate: "2026-08-01" },
      [
        {
          fields: {},
          members: [{ fields: { birth_date: "2000-01-01", category: "open" } }],
        },
      ],
      [],
      playerSchema,
      1
    )
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.message).toMatch(/maximum age is 17/i)
  })
})

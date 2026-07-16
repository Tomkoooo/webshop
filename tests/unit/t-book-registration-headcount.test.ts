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
    { key: "gender", label: "Nem", type: "select" as const, required: true, choices: [
      { value: "female", label: "Nő" },
      { value: "male", label: "Férfi" },
    ]},
  ]

  it("blocks over-18 for U18 event", () => {
    const issues = validateEligibility(
      { eligibilityPreset: "under18", startDate: "2026-08-01" },
      [{ fields: {}, members: [{ fields: { birth_date: "2000-01-01", gender: "female" } }] }],
      [],
      playerSchema,
      1
    )
    expect(issues.length).toBeGreaterThan(0)
    expect(issues[0]?.message).toMatch(/legfeljebb 17/)
  })

  it("allows eligible female for women event", () => {
    const issues = validateEligibility(
      { eligibilityPreset: "women", startDate: "2026-08-01" },
      [{ fields: {}, members: [{ fields: { birth_date: "1990-05-01", gender: "female" } }] }],
      [],
      playerSchema,
      1
    )
    expect(issues).toHaveLength(0)
  })
})

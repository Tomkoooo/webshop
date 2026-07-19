import { describe, expect, it } from "vitest"
import { publicEligibilityFromEvent } from "@wse/plugin-t-book/lib/public-eligibility"
import { validateEligibility } from "@wse/plugin-t-book/lib/eligibility"

describe("publicEligibilityFromEvent", () => {
  it("exposes form rules for storefront validation", () => {
    const publicEvent = publicEligibilityFromEvent({
      eligibilityPreset: "form_rules",
      eligibilityFormRules: {
        logic: "and",
        rules: [
          {
            id: "r1",
            fieldKey: "nem",
            op: "equals",
            value: "female",
            message: "Only females can enter",
          },
        ],
      },
    })

    const schema = [
      {
        key: "nem",
        label: "Nem",
        type: "select" as const,
        required: true,
        choices: [
          { value: "female", label: "Nő" },
          { value: "male", label: "Férfi" },
        ],
      },
    ]

    const fail = validateEligibility(
      publicEvent,
      [{ fields: { nem: "male" } }],
      schema,
      [],
      null
    )
    expect(fail.length).toBeGreaterThan(0)
    expect(fail[0]?.message).toMatch(/Only females can enter/)

    const ok = validateEligibility(
      publicEvent,
      [{ fields: { nem: "female" } }],
      schema,
      [],
      null
    )
    expect(ok).toHaveLength(0)
  })
})

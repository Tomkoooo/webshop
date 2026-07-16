import { describe, expect, it } from "vitest"
import FooterSetting from "@wse/core/models/FooterSetting"

describe("FooterSetting schema", () => {
  it("persists organizerSection, contactEntries, and paymentMethodsNote (not stripped by strict mode)", () => {
    const doc = new FooterSetting({
      key: "footer:world-darts-festival",
      tagline: "Test",
      organizerSection: {
        title: "Szervező",
        companyName: "Acme Kft.",
        registeredAddress: "Budapest",
        mailingAddress: "Budapest",
        openingHours: "H–P 9–17",
        taxNumber: "12345678-1-42",
      },
      contactEntries: [{ label: "Email", value: "a@b.c", kind: "mailto" }],
      paymentMethodsNote: "Stripe",
    })

    const plain = doc.toObject() as Record<string, unknown>
    expect(plain.organizerSection).toMatchObject({
      title: "Szervező",
      companyName: "Acme Kft.",
      taxNumber: "12345678-1-42",
    })
    expect(plain.contactEntries).toMatchObject([
      { label: "Email", value: "a@b.c", kind: "mailto" },
    ])
    expect(plain.paymentMethodsNote).toBe("Stripe")
  })
})

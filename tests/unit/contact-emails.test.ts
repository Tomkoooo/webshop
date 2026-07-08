import { describe, expect, it } from "vitest"
import {
  formatContactEmailsForDisplay,
  parseContactEmailsFromShopContent,
  primaryContactEmail,
  serializeContactEmails,
} from "@wse/core/lib/contact-emails"

describe("contact-emails", () => {
  it("parses contact_emails JSON", () => {
    const entries = parseContactEmailsFromShopContent({
      contact_emails: JSON.stringify([
        { id: "a", label: "Sales", email: "sales@test.com" },
        { id: "b", label: "Support", email: "support@test.com" },
      ]),
    })
    expect(entries).toHaveLength(2)
    expect(primaryContactEmail(entries)).toBe("sales@test.com")
  })

  it("falls back to legacy contact_email", () => {
    const entries = parseContactEmailsFromShopContent({
      contact_email: "legacy@test.com",
    })
    expect(entries).toEqual([{ id: "legacy", label: "Általános", email: "legacy@test.com" }])
  })

  it("formats multiple emails for display", () => {
    const text = formatContactEmailsForDisplay([
      { id: "1", label: "Sales", email: "a@test.com" },
      { id: "2", label: "Help", email: "b@test.com" },
    ])
    expect(text).toContain("Sales: a@test.com")
    expect(text).toContain("Help: b@test.com")
  })

  it("round-trips serialize", () => {
    const raw = serializeContactEmails([{ id: "x", label: "X", email: "x@test.com" }])
    const parsed = parseContactEmailsFromShopContent({ contact_emails: raw })
    expect(parsed[0]?.email).toBe("x@test.com")
  })
})

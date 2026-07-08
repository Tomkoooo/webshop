import { describe, expect, it } from "vitest"
import { resolveSiteContactChannels } from "@wse/core/lib/site-contact"

describe("site-contact", () => {
  it("exposes emails on SiteContact for templates", () => {
    const contact = resolveSiteContactChannels({
      contact_emails: JSON.stringify([
        { id: "a", label: "Sales", email: "a@test.com" },
        { id: "b", label: "Help", email: "b@test.com" },
      ]),
      contact_phone: "+36 1 234 5678",
    })
    expect(contact.emails).toHaveLength(2)
    expect(contact.primaryEmail).toBe("a@test.com")
    expect(contact.emailsDisplay).toContain("Sales")
  })
})

import { describe, expect, it } from "vitest"
import { sortFooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"

describe("sortFooterLegalLinks", () => {
  it("orders impresszum, terms, then gdpr", () => {
    const sorted = sortFooterLegalLinks([
      { key: "gdpr", title: "GDPR", href: "/a" },
      { key: "terms", title: "Terms", href: "/b" },
      { key: "impresszum", title: "Imprint", href: "/c" },
    ])
    expect(sorted.map((item) => item.key)).toEqual(["impresszum", "terms", "gdpr"])
  })
})

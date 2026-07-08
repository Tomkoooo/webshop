import { describe, expect, it } from "vitest"
import { withStorefrontPageTitle } from "@wse/core/lib/storefront-page-title"

describe("withStorefrontPageTitle", () => {
  it("appends shop name", () => {
    expect(withStorefrontPageTitle("Profil", "Acme Shop")).toBe("Profil | Acme Shop")
  })

  it("does not duplicate shop suffix", () => {
    expect(withStorefrontPageTitle("Profil | Acme Shop", "Acme Shop")).toBe("Profil | Acme Shop")
  })

  it("returns shop name when page title is empty", () => {
    expect(withStorefrontPageTitle("", "Acme Shop")).toBe("Acme Shop")
  })
})

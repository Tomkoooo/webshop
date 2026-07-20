import { describe, expect, it } from "vitest"
import {
  isEventListedOnPublicSite,
  publicBookingPath,
} from "../../packages/plugins/t-book/lib/event-public-listing"

describe("event public listing", () => {
  it("treats link_only as hidden from public list", () => {
    expect(isEventListedOnPublicSite("listed")).toBe(true)
    expect(isEventListedOnPublicSite("link_only")).toBe(false)
    expect(isEventListedOnPublicSite(undefined)).toBe(true)
  })

  it("builds booking path", () => {
    expect(publicBookingPath("abc123")).toBe("/foglalas/abc123")
  })
})

import { describe, expect, it } from "vitest"
import { plainTextFromHtml } from "@wse/core/lib/plain-text-from-html"

describe("plainTextFromHtml", () => {
  it("returns empty string for blank input", () => {
    expect(plainTextFromHtml("")).toBe("")
    expect(plainTextFromHtml(undefined)).toBe("")
  })

  it("strips tags and collapses whitespace", () => {
    expect(plainTextFromHtml("<p>Hello <strong>world</strong></p>")).toBe("Hello world")
  })
})

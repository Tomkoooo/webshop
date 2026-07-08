import { describe, expect, it } from "vitest"
import {
  hasContactFieldValue,
  resolveContactDisplayField,
} from "@wse/core/lib/contact-display"

describe("contact-display", () => {
  it("treats empty and placeholder phone as hidden", () => {
    expect(hasContactFieldValue("")).toBe(false)
    expect(hasContactFieldValue("   ")).toBe(false)
    expect(hasContactFieldValue("+36...")).toBe(false)
  })

  it("accepts real phone numbers", () => {
    expect(hasContactFieldValue("+36 1 234 5678")).toBe(true)
  })

  it("resolveContactDisplayField prefers primary over fallback", () => {
    expect(resolveContactDisplayField("", "+36 30 111 2233")).toBe("+36 30 111 2233")
    expect(resolveContactDisplayField("+36 1 111", "+36 2 222")).toBe("+36 1 111")
    expect(resolveContactDisplayField("", "")).toBe("")
  })
})

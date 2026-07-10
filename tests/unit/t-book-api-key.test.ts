import { describe, expect, it } from "vitest"
import { isValidTBookApiKeyFormat, normalizeTBookApiKey } from "@wse/plugin-t-book/lib/api-key"

describe("normalizeTBookApiKey", () => {
  it("strips whitespace and non-ASCII characters from pasted keys", () => {
    const key = "tbk_" + "a".repeat(40)
    expect(normalizeTBookApiKey(`  ${key}  `)).toBe(key)
    expect(normalizeTBookApiKey(`\uFEFF${key}`)).toBe(key)
    expect(normalizeTBookApiKey(`${key}\u00A0`)).toBe(key)
    expect(normalizeTBookApiKey(`é${key}í`)).toBe(key)
  })

  it("validates tbk_ prefix and minimum length", () => {
    const key = "tbk_" + "a".repeat(40)
    expect(isValidTBookApiKeyFormat(key)).toBe(true)
    expect(isValidTBookApiKeyFormat("tbk_short")).toBe(false)
    expect(isValidTBookApiKeyFormat("")).toBe(false)
  })
})

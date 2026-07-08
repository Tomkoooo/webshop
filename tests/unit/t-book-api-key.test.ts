import { describe, expect, it } from "vitest"
import {
  apiKeyHint,
  extractApiKeyFromRequest,
  generateApiKey,
  hashApiKey,
  verifyApiKey,
  TBOOK_API_KEY_HEADER,
  TBOOK_API_KEY_PREFIX,
} from "@wse/plugin-t-book/lib/api-key"

describe("tBook API keys", () => {
  it("generates prefixed, unique keys", () => {
    const a = generateApiKey()
    const b = generateApiKey()
    expect(a).toMatch(new RegExp(`^${TBOOK_API_KEY_PREFIX}[0-9a-f]{48}$`))
    expect(a).not.toBe(b)
  })

  it("verifies a key against its stored hash", () => {
    const key = generateApiKey()
    const hash = hashApiKey(key)
    expect(verifyApiKey(key, hash)).toBe(true)
    expect(verifyApiKey(generateApiKey(), hash)).toBe(false)
    expect(verifyApiKey("", hash)).toBe(false)
    expect(verifyApiKey(key, "")).toBe(false)
  })

  it("hint hides the middle of the key", () => {
    const key = generateApiKey()
    const hint = apiKeyHint(key)
    expect(hint.length).toBeLessThan(key.length)
    expect(hint.startsWith(key.slice(0, 8))).toBe(true)
    expect(hint.endsWith(key.slice(-4))).toBe(true)
  })

  it("extracts key from the dedicated header", () => {
    const request = new Request("https://example.com", {
      headers: { [TBOOK_API_KEY_HEADER]: "tbk_test" },
    })
    expect(extractApiKeyFromRequest(request)).toBe("tbk_test")
  })

  it("extracts key from a bearer token", () => {
    const request = new Request("https://example.com", {
      headers: { Authorization: "Bearer tbk_bearer" },
    })
    expect(extractApiKeyFromRequest(request)).toBe("tbk_bearer")
  })

  it("returns null when no key is present", () => {
    expect(extractApiKeyFromRequest(new Request("https://example.com"))).toBeNull()
  })
})

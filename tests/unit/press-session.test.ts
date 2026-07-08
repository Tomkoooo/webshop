import { describe, expect, it, beforeEach, afterEach } from "vitest"
import {
  createPressSessionToken,
  verifyPressSessionToken,
} from "@wse/plugin-press-kit/lib/press-session"

describe("press-session", () => {
  const originalSecret = process.env.AUTH_SECRET

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-press-session-secret"
  })

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.AUTH_SECRET
    else process.env.AUTH_SECRET = originalSecret
  })

  it("creates and verifies a valid session token", () => {
    const token = createPressSessionToken("contact-123")
    const payload = verifyPressSessionToken(token)
    expect(payload?.contactId).toBe("contact-123")
    expect(payload?.exp).toBeGreaterThan(Date.now())
  })

  it("rejects tampered tokens", () => {
    const token = createPressSessionToken("contact-123")
    const tampered = `${token}x`
    expect(verifyPressSessionToken(tampered)).toBeNull()
  })

  it("rejects expired tokens", () => {
    const encoded = Buffer.from(
      JSON.stringify({ contactId: "x", exp: Date.now() - 1000 })
    ).toString("base64url")
    const { createHmac } = require("crypto") as typeof import("crypto")
    const sig = createHmac("sha256", process.env.AUTH_SECRET!)
      .update(encoded)
      .digest("base64url")
    expect(verifyPressSessionToken(`${encoded}.${sig}`)).toBeNull()
  })
})

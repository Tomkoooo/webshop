import { beforeEach, describe, expect, it } from "vitest"
import {
  checkRateLimit,
  clientKeyFromRequest,
  resetRateLimits,
} from "@wse/plugin-t-book/lib/rate-limit"

describe("tBook rate limiter", () => {
  beforeEach(() => resetRateLimits())

  it("allows up to the limit inside a window", () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("k", 5, 60_000, now + i).allowed).toBe(true)
    }
    const blocked = checkRateLimit("k", 5, 60_000, now + 10)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it("resets after the window elapses", () => {
    const now = 1_000_000
    for (let i = 0; i < 5; i++) checkRateLimit("k", 5, 60_000, now)
    expect(checkRateLimit("k", 5, 60_000, now + 60_001).allowed).toBe(true)
  })

  it("tracks scopes independently", () => {
    const now = 1_000_000
    for (let i = 0; i < 3; i++) checkRateLimit("a", 3, 60_000, now)
    expect(checkRateLimit("a", 3, 60_000, now).allowed).toBe(false)
    expect(checkRateLimit("b", 3, 60_000, now).allowed).toBe(true)
  })

  it("derives the client key from forwarded headers", () => {
    const request = new Request("https://example.com", {
      headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" },
    })
    expect(clientKeyFromRequest(request, "quote")).toBe("quote:1.2.3.4")
    expect(clientKeyFromRequest(new Request("https://example.com"), "quote")).toBe("quote:unknown")
  })
})

import { afterEach, describe, expect, it, vi } from "vitest"
import {
  absoluteAppUrl,
  isUnusableRedirectHost,
  resolveAuthRedirectUrl,
} from "../../packages/core/src/lib/auth-redirect"

describe("auth-redirect", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("flags Docker bind / loopback hosts", () => {
    expect(isUnusableRedirectHost("0.0.0.0")).toBe(true)
    expect(isUnusableRedirectHost("127.0.0.1")).toBe(true)
    expect(isUnusableRedirectHost("localhost")).toBe(true)
    expect(isUnusableRedirectHost("ugyved.testsrt.org.hu")).toBe(false)
  })

  it("rewrites 0.0.0.0 post-login redirects onto AUTH_URL", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ugyved.testsrt.org.hu")
    vi.stubEnv("AUTH_URL", "https://ugyved.testsrt.org.hu")
    vi.stubEnv("NODE_ENV", "production")

    expect(resolveAuthRedirectUrl("https://0.0.0.0:3000/admin")).toBe(
      "https://ugyved.testsrt.org.hu/admin"
    )
    expect(resolveAuthRedirectUrl("/admin", "https://0.0.0.0:3000")).toBe(
      "https://ugyved.testsrt.org.hu/admin"
    )
    expect(resolveAuthRedirectUrl("https://0.0.0.0:3000/auth/admin-callback?callbackUrl=%2Fadmin")).toBe(
      "https://ugyved.testsrt.org.hu/auth/admin-callback?callbackUrl=%2Fadmin"
    )
  })

  it("keeps same-origin public redirects", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ugyved.testsrt.org.hu")
    expect(resolveAuthRedirectUrl("https://ugyved.testsrt.org.hu/admin")).toBe(
      "https://ugyved.testsrt.org.hu/admin"
    )
  })

  it("absoluteAppUrl prefers public env over request.url", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://ugyved.testsrt.org.hu")
    expect(absoluteAppUrl("/admin", "https://0.0.0.0:3000/auth/admin-callback")).toBe(
      "https://ugyved.testsrt.org.hu/admin"
    )
  })
})

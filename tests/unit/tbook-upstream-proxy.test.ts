import { describe, expect, it, beforeEach, afterEach } from "vitest"
import {
  getTBookUpstreamApiBase,
  shouldProxyPublicTBookRoute,
} from "../../packages/plugins/t-book/lib/upstream-proxy"
import {
  resolveTBookServerApiBase,
  TBOOK_SAME_ORIGIN_API_BASE,
} from "../../packages/plugins/t-book/lib/tbook-api-base"

describe("tBook API base resolution", () => {
  const prevUpstream = process.env.TBOOK_UPSTREAM_API_BASE
  const prevPublic = process.env.NEXT_PUBLIC_TBOOK_API_BASE

  beforeEach(() => {
    delete process.env.TBOOK_UPSTREAM_API_BASE
    delete process.env.NEXT_PUBLIC_TBOOK_API_BASE
  })

  afterEach(() => {
    if (prevUpstream === undefined) delete process.env.TBOOK_UPSTREAM_API_BASE
    else process.env.TBOOK_UPSTREAM_API_BASE = prevUpstream
    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_TBOOK_API_BASE
    else process.env.NEXT_PUBLIC_TBOOK_API_BASE = prevPublic
  })

  it("resolves external upstream from container env on the server", () => {
    process.env.NEXT_PUBLIC_TBOOK_API_BASE = "https://tbook.example.com/api/plugins/t-book/"
    expect(resolveTBookServerApiBase()).toBe("https://tbook.example.com/api/plugins/t-book")
  })

  it("falls back to same-origin when no upstream env is set", () => {
    expect(resolveTBookServerApiBase()).toBe(TBOOK_SAME_ORIGIN_API_BASE)
  })
})

describe("tBook upstream proxy helpers", () => {
  const prevUpstream = process.env.TBOOK_UPSTREAM_API_BASE
  const prevPublic = process.env.NEXT_PUBLIC_TBOOK_API_BASE

  beforeEach(() => {
    delete process.env.TBOOK_UPSTREAM_API_BASE
    delete process.env.NEXT_PUBLIC_TBOOK_API_BASE
  })

  afterEach(() => {
    if (prevUpstream === undefined) delete process.env.TBOOK_UPSTREAM_API_BASE
    else process.env.TBOOK_UPSTREAM_API_BASE = prevUpstream
    if (prevPublic === undefined) delete process.env.NEXT_PUBLIC_TBOOK_API_BASE
    else process.env.NEXT_PUBLIC_TBOOK_API_BASE = prevPublic
  })

  it("detects external upstream from NEXT_PUBLIC_TBOOK_API_BASE", () => {
    process.env.NEXT_PUBLIC_TBOOK_API_BASE = "https://tbook.example.com/api/plugins/t-book/"
    expect(getTBookUpstreamApiBase()).toBe("https://tbook.example.com/api/plugins/t-book")
  })

  it("returns null when upstream is same-origin path", () => {
    process.env.NEXT_PUBLIC_TBOOK_API_BASE = "/api/plugins/t-book"
    expect(getTBookUpstreamApiBase()).toBeNull()
  })

  it("proxies public storefront routes only", () => {
    expect(shouldProxyPublicTBookRoute("events", ["events"], "GET")).toBe(true)
    expect(shouldProxyPublicTBookRoute("events", ["events", "abc"], "GET")).toBe(true)
    expect(shouldProxyPublicTBookRoute("quote", ["quote"], "POST")).toBe(true)
    expect(shouldProxyPublicTBookRoute("bookings", ["bookings"], "POST")).toBe(true)
    expect(shouldProxyPublicTBookRoute("bookings", ["bookings", "status"], "GET")).toBe(true)
    expect(shouldProxyPublicTBookRoute("admin", ["connection-test"], "POST")).toBe(false)
    expect(shouldProxyPublicTBookRoute("directory", ["directory"], "GET")).toBe(false)
  })
})

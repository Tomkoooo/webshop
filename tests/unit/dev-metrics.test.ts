import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import {
  getDevMetricsFilePath,
  isDevMetricsEnabled,
  sanitizeDevMetricPayload,
  sanitizeMetricUrl,
} from "@wse/core/lib/dev-metrics"
import { normalizeBrowserMetricEvents } from "@wse/core/lib/dev-metrics-browser-payload"

describe("dev metrics", () => {
  const envBackup = { ...process.env }

  afterEach(() => {
    process.env = { ...envBackup }
    vi.restoreAllMocks()
  })

  it("is enabled only by explicit flag", () => {
    delete process.env.DEV_METRICS
    expect(isDevMetricsEnabled()).toBe(false)

    process.env.DEV_METRICS = "1"
    expect(isDevMetricsEnabled()).toBe(true)

    process.env.DEV_METRICS = "true"
    expect(isDevMetricsEnabled()).toBe(true)
  })

  it("redacts sensitive query parameters", () => {
    expect(
      sanitizeMetricUrl("/checkout/success?tempOrderId=tmp1&session_id=cs_test_secret&email=a@b.test")
    ).toBe("/checkout/success?tempOrderId=tmp1&session_id=%5Bredacted%5D&email=%5Bredacted%5D")
  })

  it("supports a custom metrics output file", () => {
    process.env.DEV_METRICS_FILE = ".next/dev-metrics/custom.jsonl"
    expect(getDevMetricsFilePath()).toMatch(/\.next\/dev-metrics\/custom\.jsonl$/)
  })

  it("sanitizes metric payload metadata", () => {
    const payload = sanitizeDevMetricPayload({
      source: "server",
      category: "api\n",
      name: "checkout\torder",
      url: "/api/orders?token=abc",
      metadata: {
        token: "secret",
        count: 2,
        nested: { email: "buyer@example.test", ok: true },
      },
    })

    expect(payload).toMatchObject({
      category: "api",
      name: "checkout order",
      url: "/api/orders?token=%5Bredacted%5D",
      metadata: {
        token: "[redacted]",
        count: 2,
        nested: { email: "[redacted]", ok: true },
      },
    })
  })

  it("accepts only valid browser metric payloads", () => {
    expect(normalizeBrowserMetricEvents({ name: "missing-category" })).toEqual([])

    const events = normalizeBrowserMetricEvents({
        events: [
          {
            category: "client-fetch",
            name: "request",
            value: 123.456,
            unit: "ms",
            status: "ok",
            url: "/api/user/orders?token=secret",
          },
        ],
    })

    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      source: "browser",
      category: "client-fetch",
      name: "request",
      value: 123.46,
      url: "/api/user/orders?token=%5Bredacted%5D",
    })
  })

  it("hides the browser intake route when disabled", async () => {
    delete process.env.DEV_METRICS
    const { POST } = await import("@wse/core/app/api/dev/metrics/route")
    const response = await POST(
      new NextRequest("http://localhost/api/dev/metrics", {
        method: "POST",
        body: JSON.stringify({ category: "web-vital", name: "LCP", value: 1000 }),
      })
    )

    expect(response.status).toBe(404)
  })
})

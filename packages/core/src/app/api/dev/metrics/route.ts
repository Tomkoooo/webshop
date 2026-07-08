import { NextRequest, NextResponse } from "next/server"
import {
  isDevMetricsEnabled,
  recordDevMetric,
} from "@wse/core/lib/dev-metrics"
import { normalizeBrowserMetricEvents } from "@wse/core/lib/dev-metrics-browser-payload"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BODY_BYTES = 64 * 1024

export async function POST(req: NextRequest) {
  if (!isDevMetricsEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const contentLength = Number(req.headers.get("content-length") || 0)
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 })
  }

  try {
    const body = await req.json()
    const events = normalizeBrowserMetricEvents(body)

    if (events.length === 0) {
      return NextResponse.json({ error: "Invalid metric payload" }, { status: 400 })
    }

    await Promise.all(events.map((event) => recordDevMetric(event)))
    return NextResponse.json({ ok: true, recorded: events.length })
  } catch {
    return NextResponse.json({ error: "Invalid metric payload" }, { status: 400 })
  }
}

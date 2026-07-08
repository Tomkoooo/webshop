import {
  sanitizeDevMetricPayload,
  type DevMetricPayload,
} from "@wse/core/lib/dev-metrics"

const MAX_BATCH_SIZE = 20

export function normalizeBrowserMetricEvents(body: unknown): DevMetricPayload[] {
  const rawEvents = Array.isArray(body)
    ? body
    : Array.isArray((body as { events?: unknown })?.events)
      ? (body as { events: unknown[] }).events
      : [body]

  return rawEvents
    .slice(0, MAX_BATCH_SIZE)
    .map(normalizeBrowserMetricEvent)
    .filter((event): event is DevMetricPayload => Boolean(event))
}

function normalizeBrowserMetricEvent(input: unknown): DevMetricPayload | null {
  if (!input || typeof input !== "object") return null

  const raw = input as Record<string, unknown>
  if (typeof raw.category !== "string" || typeof raw.name !== "string") return null

  const payload = sanitizeDevMetricPayload({
    source: "browser",
    category: raw.category,
    name: raw.name,
    value: typeof raw.value === "number" ? raw.value : undefined,
    unit: isMetricUnit(raw.unit) ? raw.unit : undefined,
    status: raw.status === "error" ? "error" : raw.status === "ok" ? "ok" : undefined,
    route: typeof raw.route === "string" ? raw.route : undefined,
    method: typeof raw.method === "string" ? raw.method : undefined,
    url: typeof raw.url === "string" ? raw.url : undefined,
    metadata:
      raw.metadata && typeof raw.metadata === "object" && !Array.isArray(raw.metadata)
        ? (raw.metadata as Record<string, unknown>)
        : undefined,
  })

  return payload.category && payload.name ? payload : null
}

function isMetricUnit(value: unknown): value is NonNullable<DevMetricPayload["unit"]> {
  return value === "ms" || value === "count" || value === "score" || value === "bytes"
}

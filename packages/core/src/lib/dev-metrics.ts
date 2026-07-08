import { appendFile, mkdir } from "fs/promises"
import path from "path"

export type DevMetricStatus = "ok" | "error"

export type DevMetricPayload = {
  source: "server" | "browser"
  category: string
  name: string
  value?: number
  unit?: "ms" | "count" | "score" | "bytes"
  status?: DevMetricStatus
  route?: string
  method?: string
  url?: string
  metadata?: Record<string, unknown>
}

type DevMetricRecord = DevMetricPayload & {
  timestamp: string
  pid: number
}

const DEFAULT_METRICS_DIR = path.join(process.cwd(), ".next", "dev-metrics")
const DEFAULT_METRICS_FILE = path.join(DEFAULT_METRICS_DIR, "metrics.jsonl")
const SENSITIVE_QUERY_RE = /(token|secret|session|password|pass|email|auth|key|signature|sig|checkout_session_id|session_id)/i
const MAX_STRING_LENGTH = 300
const MAX_METADATA_KEYS = 24

export function isDevMetricsEnabled(): boolean {
  return process.env.DEV_METRICS === "1" || process.env.DEV_METRICS?.toLowerCase() === "true"
}

export function getDevMetricsFilePath(): string {
  const configuredPath = process.env.DEV_METRICS_FILE?.trim()
  if (!configuredPath) return DEFAULT_METRICS_FILE
  return path.isAbsolute(configuredPath) ? configuredPath : path.join(process.cwd(), configuredPath)
}

export function sanitizeMetricUrl(input: string | URL | null | undefined): string | undefined {
  if (!input) return undefined

  try {
    const url = new URL(String(input), "http://local.dev")
    for (const key of [...url.searchParams.keys()]) {
      if (SENSITIVE_QUERY_RE.test(key)) {
        url.searchParams.set(key, "[redacted]")
      }
    }

    const query = url.searchParams.toString()
    if (String(input).startsWith("http://") || String(input).startsWith("https://")) {
      return `${url.origin}${url.pathname}${query ? `?${query}` : ""}`
    }
    return `${url.pathname}${query ? `?${query}` : ""}`
  } catch {
    return truncateMetricString(String(input).replace(SENSITIVE_QUERY_RE, "[redacted]"))
  }
}

export function sanitizeDevMetricPayload(payload: DevMetricPayload): DevMetricPayload {
  return {
    source: payload.source,
    category: sanitizeMetricString(payload.category) || "unknown",
    name: sanitizeMetricString(payload.name) || "unknown",
    value: sanitizeMetricNumber(payload.value),
    unit: payload.unit,
    status: payload.status,
    route: sanitizeRoute(payload.route),
    method: sanitizeMetricString(payload.method)?.toUpperCase(),
    url: sanitizeMetricUrl(payload.url),
    metadata: sanitizeMetricMetadata(payload.metadata),
  }
}

export async function recordDevMetric(payload: DevMetricPayload): Promise<void> {
  if (!isDevMetricsEnabled()) return

  const sanitized = sanitizeDevMetricPayload(payload)
  const record: DevMetricRecord = {
    ...sanitized,
    timestamp: new Date().toISOString(),
    pid: process.pid,
  }

  try {
    const metricsFile = getDevMetricsFilePath()
    await mkdir(path.dirname(metricsFile), { recursive: true })
    await appendFile(metricsFile, `${JSON.stringify(record)}\n`, "utf8")
  } catch (error) {
    console.warn("[dev-metrics] failed to write metric", error)
  }

  const value = typeof record.value === "number" ? ` ${Math.round(record.value * 100) / 100}${record.unit || ""}` : ""
  const route = record.route ? ` ${record.route}` : ""
  console.info(`[dev-metrics] ${record.category}.${record.name}${route}${value}`)
}

export async function timeDevMetric<T>(
  name: string,
  fn: () => Promise<T>,
  meta: Omit<DevMetricPayload, "source" | "name" | "value" | "unit" | "status"> & {
    source?: DevMetricPayload["source"]
  } = { category: "server" }
): Promise<T> {
  if (!isDevMetricsEnabled()) {
    return fn()
  }

  const start = performance.now()
  try {
    const result = await fn()
    await recordDevMetric({
      source: meta.source || "server",
      category: meta.category,
      name,
      value: performance.now() - start,
      unit: "ms",
      status: "ok",
      route: meta.route,
      method: meta.method,
      url: meta.url,
      metadata: meta.metadata,
    })
    return result
  } catch (error) {
    await recordDevMetric({
      source: meta.source || "server",
      category: meta.category,
      name,
      value: performance.now() - start,
      unit: "ms",
      status: "error",
      route: meta.route,
      method: meta.method,
      url: meta.url,
      metadata: {
        ...meta.metadata,
        errorName: error instanceof Error ? error.name : typeof error,
      },
    })
    throw error
  }
}

export async function timeDevResponseMetric<T extends Response>(
  name: string,
  fn: () => Promise<T>,
  meta: Omit<DevMetricPayload, "source" | "name" | "value" | "unit" | "status"> & {
    source?: DevMetricPayload["source"]
  }
): Promise<T> {
  if (!isDevMetricsEnabled()) {
    return fn()
  }

  const start = performance.now()
  try {
    const response = await fn()
    await recordDevMetric({
      source: meta.source || "server",
      category: meta.category,
      name,
      value: performance.now() - start,
      unit: "ms",
      status: response.status >= 400 ? "error" : "ok",
      route: meta.route,
      method: meta.method,
      url: meta.url,
      metadata: {
        ...meta.metadata,
        httpStatus: response.status,
      },
    })
    return response
  } catch (error) {
    await recordDevMetric({
      source: meta.source || "server",
      category: meta.category,
      name,
      value: performance.now() - start,
      unit: "ms",
      status: "error",
      route: meta.route,
      method: meta.method,
      url: meta.url,
      metadata: {
        ...meta.metadata,
        errorName: error instanceof Error ? error.name : typeof error,
      },
    })
    throw error
  }
}

function sanitizeMetricMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!metadata) return undefined

  const entries = Object.entries(metadata).slice(0, MAX_METADATA_KEYS)
  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of entries) {
    if (SENSITIVE_QUERY_RE.test(key)) {
      sanitized[key] = "[redacted]"
      continue
    }
    sanitized[sanitizeMetricString(key) || "unknown"] = sanitizeMetadataValue(value)
  }
  return sanitized
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (value == null || typeof value === "boolean") return value
  if (typeof value === "number") return sanitizeMetricNumber(value)
  if (typeof value === "string") return sanitizeMetricString(value)
  if (Array.isArray(value)) return value.slice(0, 12).map(sanitizeMetadataValue)
  if (typeof value === "object") {
    return sanitizeMetricMetadata(value as Record<string, unknown>)
  }
  return sanitizeMetricString(String(value))
}

function sanitizeMetricNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined
  return Math.round(value * 100) / 100
}

function sanitizeRoute(route: string | undefined): string | undefined {
  if (!route) return undefined
  return sanitizeMetricUrl(route)
}

function sanitizeMetricString(value: string | undefined): string | undefined {
  if (!value) return undefined
  return truncateMetricString(value.replace(/[\r\n\t]/g, " ").trim())
}

function truncateMetricString(value: string): string {
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...` : value
}

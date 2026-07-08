/**
 * Lightweight async timing for storefront cold-path debugging (development only).
 */
import { timeDevMetric } from "@wse/core/lib/dev-metrics"

export async function timeAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
  return timeDevMetric(label, fn, { category: "storefront" })
}

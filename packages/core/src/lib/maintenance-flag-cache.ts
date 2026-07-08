/** In-process maintenance flag cache (middleware + API route share within one Node instance). */
const TTL_MS = 30_000

let cache: { enabled: boolean; expiresAt: number } | null = null

export function getCachedMaintenanceEnabled(): boolean | null {
  if (!cache || Date.now() >= cache.expiresAt) return null
  return cache.enabled
}

export function setCachedMaintenanceEnabled(enabled: boolean) {
  cache = { enabled, expiresAt: Date.now() + TTL_MS }
}

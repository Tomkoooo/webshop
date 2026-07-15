/** Same-origin plugin mount — used by browser calls and the upstream proxy. */
export const TBOOK_SAME_ORIGIN_API_BASE = "/api/plugins/t-book"

/**
 * tBook API base for server-side fetches (SSR, CMS connection test, upstream proxy config).
 * Reads container/runtime env — do not rely on this from client bundles.
 */
export function resolveTBookServerApiBase(override?: string): string {
  const trimmed = override?.replace(/\/$/, "")
  if (trimmed) return trimmed
  const fromEnv =
    process.env.TBOOK_UPSTREAM_API_BASE?.trim() ||
    process.env.NEXT_PUBLIC_TBOOK_API_BASE?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, "")
  return TBOOK_SAME_ORIGIN_API_BASE
}

export function isExternalTBookUpstream(base: string): boolean {
  return /^https?:\/\//i.test(base)
}

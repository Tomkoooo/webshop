/** Stable string key for quote payloads — avoids re-fetching when object identity changes. */
export function stableQuoteKey(payload: unknown): string {
  try {
    return JSON.stringify(payload)
  } catch {
    return String(payload)
  }
}

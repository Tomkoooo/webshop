import { createHash, randomBytes, timingSafeEqual } from "crypto"

export const TBOOK_API_KEY_PREFIX = "tbk_"
export const TBOOK_API_KEY_HEADER = "x-tbook-api-key"

/** Generates a new plaintext API key (shown to the admin once). */
export function generateApiKey(): string {
  return `${TBOOK_API_KEY_PREFIX}${randomBytes(24).toString("hex")}`
}

/** Only the SHA-256 hash is persisted — a leaked DB dump never exposes keys. */
export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex")
}

/** Non-secret hint for the admin list, e.g. `tbk_ab12…89ef`. */
export function apiKeyHint(plaintext: string): string {
  return `${plaintext.slice(0, 8)}…${plaintext.slice(-4)}`
}

export function verifyApiKey(plaintext: string, storedHash: string): boolean {
  if (!plaintext || !storedHash) return false
  const a = Buffer.from(hashApiKey(plaintext), "hex")
  const b = Buffer.from(storedHash, "hex")
  return a.length === b.length && timingSafeEqual(a, b)
}

export function extractApiKeyFromRequest(request: Request): string | null {
  const header = request.headers.get(TBOOK_API_KEY_HEADER)
  if (header?.trim()) return header.trim()
  const auth = request.headers.get("authorization")
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim() || null
  }
  return null
}

import { createHmac, timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

/**
 * Auth for the /api/management/* control-plane surface (core admin → site).
 *
 * Tokens are HMAC-signed service tokens: `wsm1.<expiresAtMs>.<hex signature>`
 * where signature = HMAC-SHA256(MANAGEMENT_API_SECRET, String(expiresAtMs)).
 * A raw shared secret is also accepted (`Authorization: Bearer <secret>`) for
 * simple setups. Sites without MANAGEMENT_API_SECRET reject every request.
 */

const TOKEN_PREFIX = "wsm1"

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

export function signManagementToken(secret: string, ttlMs = 5 * 60 * 1000): string {
  const expiresAt = Date.now() + ttlMs
  const signature = createHmac("sha256", secret).update(String(expiresAt)).digest("hex")
  return `${TOKEN_PREFIX}.${expiresAt}.${signature}`
}

function verifyManagementToken(secret: string, token: string): boolean {
  if (safeEqual(token, secret)) return true
  const parts = token.split(".")
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return false
  const [, expiresAtRaw, signature] = parts
  const expiresAt = Number(expiresAtRaw)
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false
  const expected = createHmac("sha256", secret).update(expiresAtRaw).digest("hex")
  return safeEqual(signature, expected)
}

/** Returns an error response when the request is not authorized, null when it is. */
export function requireManagementAuth(request: Request): Response | null {
  const secret = process.env.MANAGEMENT_API_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Management API is not enabled on this site (MANAGEMENT_API_SECRET missing)" },
      { status: 503 }
    )
  }
  const header = request.headers.get("authorization") ?? ""
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : ""
  if (!token || !verifyManagementToken(secret, token)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  return null
}

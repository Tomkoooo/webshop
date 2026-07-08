import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

/**
 * Single-operator gate for the core-admin API: requests must send
 * `x-core-admin-token` matching CORE_ADMIN_ACCESS_TOKEN. The UI keeps the
 * token in localStorage after the operator enters it once.
 */
export function requireCoreAdmin(request: Request): Response | null {
  const expected = process.env.CORE_ADMIN_ACCESS_TOKEN?.trim()
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CORE_ADMIN_ACCESS_TOKEN is not configured" },
      { status: 503 }
    )
  }
  const got = request.headers.get("x-core-admin-token") ?? ""
  const a = Buffer.from(got)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
  }
  return null
}

import { createHmac, timingSafeEqual } from "crypto"
import { cookies } from "next/headers"

export const PRESS_SESSION_COOKIE = "wse_press_session"
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type PressSessionPayload = {
  contactId: string
  exp: number
}

function sessionSecret(): string {
  return (
    process.env.PRESS_KIT_SESSION_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "press-kit-dev-secret"
  )
}

function signPayload(encoded: string): string {
  return createHmac("sha256", sessionSecret()).update(encoded).digest("base64url")
}

export function createPressSessionToken(contactId: string): string {
  const payload: PressSessionPayload = {
    contactId,
    exp: Date.now() + SESSION_TTL_MS,
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encoded}.${signPayload(encoded)}`
}

export function verifyPressSessionToken(token: string | undefined | null): PressSessionPayload | null {
  if (!token?.includes(".")) return null
  const [encoded, signature] = token.split(".")
  if (!encoded || !signature) return null

  const expected = signPayload(encoded)
  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as PressSessionPayload
    if (!payload.contactId || typeof payload.exp !== "number") return null
    if (payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export async function readPressSessionFromCookies(): Promise<PressSessionPayload | null> {
  const store = await cookies()
  const raw = store.get(PRESS_SESSION_COOKIE)?.value
  return verifyPressSessionToken(raw)
}

export function pressSessionCookieOptions(token: string) {
  return {
    name: PRESS_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  }
}

export function clearPressSessionCookieOptions() {
  return {
    name: PRESS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  }
}

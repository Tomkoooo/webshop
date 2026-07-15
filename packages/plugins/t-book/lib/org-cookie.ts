import { cookies } from "next/headers"
import { TBOOK_ACTIVE_ORG_COOKIE } from "@wse/core/lib/site-features"

export async function getActiveOrganizationIdFromCookie(): Promise<string | null> {
  const jar = await cookies()
  const value = jar.get(TBOOK_ACTIVE_ORG_COOKIE)?.value?.trim()
  return value || null
}

export function activeOrgCookieOptions(organizationId: string) {
  return {
    name: TBOOK_ACTIVE_ORG_COOKIE,
    value: organizationId,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  }
}

export function clearActiveOrgCookieOptions() {
  return {
    name: TBOOK_ACTIVE_ORG_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  }
}

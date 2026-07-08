import { signManagementToken } from "@wse/core/lib/management-auth"
import type { ISite } from "../models/Site"

/** Resources exposed by a site's /api/management surface. */
export const MANAGEMENT_RESOURCES = ["site", "branding", "seo", "theme", "content"] as const
export type ManagementResource = (typeof MANAGEMENT_RESOURCES)[number]

/**
 * Calls one site's management API with a short-lived signed service token
 * derived from the site's stored management secret.
 */
export async function callSiteManagement(
  site: Pick<ISite, "baseUrl" | "managementSecret">,
  resource: ManagementResource,
  init?: { method?: string; body?: unknown; query?: Record<string, string> }
): Promise<{ status: number; body: unknown }> {
  if (!site.managementSecret) {
    return { status: 400, body: { ok: false, error: "Site has no management secret configured" } }
  }
  const url = new URL(`/api/management/${resource}`, site.baseUrl)
  for (const [key, value] of Object.entries(init?.query ?? {})) {
    url.searchParams.set(key, value)
  }
  const token = signManagementToken(site.managementSecret)
  const response = await fetch(url, {
    method: init?.method ?? "GET",
    headers: {
      authorization: `Bearer ${token}`,
      ...(init?.body !== undefined ? { "content-type": "application/json" } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })
  const body = await response.json().catch(() => ({ ok: false, error: "Invalid JSON from site" }))
  return { status: response.status, body }
}

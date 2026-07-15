export const TBOOK_ACTIVE_ORG_COOKIE = "tbook_active_org"

export function parseBakedSiteConfig(): Record<string, unknown> | null {
  const raw = process.env.WSE_SITE_CONFIG_JSON?.trim()
  if (!raw) return null
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

export function isMultiTenantAdminEnabled(): boolean {
  const cfg = parseBakedSiteConfig()
  return cfg?.multiTenantAdmin === true
}

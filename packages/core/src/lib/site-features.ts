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

export type SiteLocaleConfig = { supported: string[]; default: string }

/** Optional per-deployment locale config baked into `WSE_SITE_CONFIG_JSON`. `null` = single-locale site (default). */
export function getSiteLocaleConfig(): SiteLocaleConfig | null {
  const cfg = parseBakedSiteConfig()
  const locales = cfg?.locales as Partial<SiteLocaleConfig> | undefined
  if (!locales || !Array.isArray(locales.supported) || locales.supported.length === 0) return null
  if (!locales.default || !locales.supported.includes(locales.default)) return null
  return { supported: locales.supported, default: locales.default }
}

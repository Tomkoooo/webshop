import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

/**
 * Tenant registry for the multi-tenant landing runtime. One deploy serves all
 * tenants; adding a landing site is registry + DNS only, no build.
 *
 * Source: LANDING_TENANTS_JSON env (JSON array) or tenants.config.json next to
 * the app (checked into the deploy). Each tenant keeps its own database —
 * the same hard isolation model as full site apps.
 */
export type LandingTenant = {
  id: string
  /** Hostnames (lowercase, no port) served for this tenant. */
  hosts: string[]
  databaseUrl: string
  /** Template whose published `page:home` blocks are rendered (default: default-modern). */
  templateId?: string
}

let cache: LandingTenant[] | null = null

export function listTenants(): LandingTenant[] {
  if (cache) return cache
  const fromEnv = process.env.LANDING_TENANTS_JSON?.trim()
  if (fromEnv) {
    cache = JSON.parse(fromEnv) as LandingTenant[]
    return cache
  }
  const configPath = path.join(process.cwd(), "tenants.config.json")
  if (existsSync(configPath)) {
    cache = JSON.parse(readFileSync(configPath, "utf8")) as LandingTenant[]
    return cache
  }
  cache = []
  return cache
}

export function resolveTenantByHost(host: string | null | undefined): LandingTenant | null {
  const normalized = host?.split(":")[0]?.toLowerCase()
  if (!normalized) return null
  return listTenants().find((t) => t.hosts.includes(normalized)) ?? null
}

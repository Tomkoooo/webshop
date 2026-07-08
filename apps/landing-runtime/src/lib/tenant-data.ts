import { MongoClient } from "mongodb"
import type { LandingTenant } from "./tenants"

/**
 * Read-only, driver-level access to a tenant's database. The landing runtime
 * renders published content only — it never writes; editing happens through
 * each tenant's admin or the core-admin management API.
 */

const clients = new Map<string, Promise<MongoClient>>()

function getClient(databaseUrl: string): Promise<MongoClient> {
  let client = clients.get(databaseUrl)
  if (!client) {
    client = new MongoClient(databaseUrl).connect()
    clients.set(databaseUrl, client)
  }
  return client
}

async function db(tenant: LandingTenant) {
  const client = await getClient(tenant.databaseUrl)
  return client.db()
}

const FALLBACK_THEME: Record<string, string> = {
  primary: "#111827",
  primaryForeground: "#FFFFFF",
  secondary: "#1F2937",
  secondaryForeground: "#FFFFFF",
  accent: "#2563EB",
  accentForeground: "#FFFFFF",
  background: "#0A0A0A",
  foreground: "#FFFFFF",
  surface: "#151515",
  surfaceForeground: "#FFFFFF",
  border: "#333333",
  muted: "#222222",
  mutedForeground: "#999999",
  success: "#16A34A",
  successForeground: "#FFFFFF",
  warning: "#D97706",
  warningForeground: "#FFFFFF",
  error: "#DC2626",
  errorForeground: "#FFFFFF",
}

export async function getTenantTheme(tenant: LandingTenant): Promise<Record<string, string>> {
  const doc = await (await db(tenant)).collection("themesettings").findOne({ key: "theme" })
  const colors = (doc?.colors ?? {}) as Record<string, unknown>
  const merged: Record<string, string> = { ...FALLBACK_THEME }
  for (const [key, value] of Object.entries(colors)) {
    if (typeof value === "string" && value) merged[key] = value
  }
  return merged
}

export async function getTenantBranding(tenant: LandingTenant) {
  const doc = await (await db(tenant)).collection("brandingsettings").findOne({ key: "branding" })
  return {
    brandName: (doc?.brandName as string) || tenant.id,
    logoNav: (doc?.logoNav as string) || "",
    logoFooter: (doc?.logoFooter as string) || "",
  }
}

export async function getTenantSeo(tenant: LandingTenant) {
  const doc = await (await db(tenant)).collection("seosettings").findOne({})
  return {
    siteTitle: (doc?.siteTitle as string) || tenant.id,
    siteDescription: (doc?.siteDescription as string) || "",
    robotsIndex: doc?.robotsIndex !== false,
  }
}

type HomepageSnapshot = { blocks?: unknown[] }

/** Published homepage blocks for the tenant's template (empty array when unset). */
export async function getTenantHomepageBlocks(tenant: LandingTenant): Promise<unknown[]> {
  const templateId = tenant.templateId ?? "default-modern"
  const doc = await (await db(tenant))
    .collection("templatecontents")
    .findOne({ templateId, pageKey: "page:home" })
  if (!doc?.value || typeof doc.value !== "string") return []
  try {
    const snapshot = JSON.parse(doc.value) as HomepageSnapshot
    return Array.isArray(snapshot.blocks) ? snapshot.blocks : []
  } catch {
    return []
  }
}

export async function getTenantReviews(tenant: LandingTenant) {
  const rows = await (await db(tenant))
    .collection("reviews")
    .find({})
    .sort({ createdAt: -1 })
    .limit(12)
    .toArray()
  return rows.map((r) => ({
    id: String(r._id),
    name: (r.name as string) ?? "",
    role: (r.role as string) ?? "",
    content: (r.content as string) ?? "",
    rating: (r.rating as number) ?? 5,
    avatar: (r.avatar as string) ?? "",
  }))
}

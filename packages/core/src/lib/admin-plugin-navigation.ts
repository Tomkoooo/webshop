import { PluginService } from "@wse/core/services/plugin"
import { pluginAdminHref } from "@wse/sdk/plugins/types"
import type { PluginModule } from "@wse/sdk/plugins/types"
import {
  getDeploymentDefinition,
  isPluginAllowlistedForDeployment,
} from "@wse/core/config/deployments-registry"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { isMultiTenantAdminEnabled } from "@wse/core/lib/site-features"
import { loadPluginModule } from "@wse/core/plugins/registry"
import { FeatureFlagService } from "@wse/core/services/feature-flags"

export type ShopDisabledAdminLanding =
  | { kind: "redirect"; href: string }
  | {
      kind: "hub"
      plugins: Array<{ id: string; name: string; href: string }>
      pendingPlugins: Array<{ id: string; name: string; settingsHref: string }>
    }

function pickPrimaryPlugin(
  plugins: Awaited<ReturnType<typeof PluginService.listEnabledWithAdmin>>
) {
  const flagged = plugins.find((p) => p.plugin.admin?.primaryWhenShopDisabled)
  if (flagged) return flagged
  if (plugins.length === 1) return plugins[0]
  return null
}

export function getPluginStatsHref(pluginId: string, plugin: PluginModule): string | null {
  const segment = plugin.admin?.statsSegment
  if (segment == null || segment === "") return null
  return pluginAdminHref(pluginId, segment)
}

/** Plugins allowlisted on this deployment with admin UI, regardless of DB feature flag. */
async function listAllowlistedAdminPlugins(host: string | null) {
  const deployment = getDeploymentDefinition(host)
  const results: Array<{
    id: string
    name: string
    plugin: PluginModule
    featureFlagKey: string | null
  }> = []

  for (const pluginId of deployment.enabledPlugins) {
    if (!isPluginAllowlistedForDeployment(pluginId, host)) continue
    let plugin: PluginModule
    try {
      plugin = await loadPluginModule(pluginId)
    } catch {
      continue
    }
    if (!plugin.admin?.Screen) continue
    if (plugin.manifest.requiresShop && !isShopEnabled()) continue
    results.push({
      id: pluginId,
      name: plugin.manifest.name,
      plugin,
      featureFlagKey: plugin.manifest.featureFlagKey ?? null,
    })
  }
  return results
}

/** Where `/admin` should go when `ENABLE_SHOP=false`. */
export async function resolveShopDisabledAdminLanding(): Promise<ShopDisabledAdminLanding> {
  const host = await PluginService.getHost()
  const plugins = await PluginService.listEnabledWithAdmin()
  const primary = pickPrimaryPlugin(plugins)

  if (primary) {
    return { kind: "redirect", href: pluginAdminHref(primary.id, "") }
  }

  const allowlisted = await listAllowlistedAdminPlugins(host)
  const pendingPlugins: Array<{ id: string; name: string; settingsHref: string }> = []

  for (const entry of allowlisted) {
    if (!entry.featureFlagKey) continue
    const enabled = await FeatureFlagService.isEnabled(entry.featureFlagKey, false)
    if (!enabled) {
      pendingPlugins.push({
        id: entry.id,
        name: entry.name,
        settingsHref: "/admin/info",
      })
    }
  }

  return {
    kind: "hub",
    plugins: plugins.map((p) => ({
      id: p.id,
      name: p.name,
      href: pluginAdminHref(p.id, ""),
    })),
    pendingPlugins,
  }
}

/** Replaces `/admin/stats` when the shop is off. */
export async function resolvePluginStatsRedirect(): Promise<string | null> {
  const plugins = await PluginService.listEnabledWithAdmin()
  const primary = pickPrimaryPlugin(plugins)
  if (!primary) return null
  return getPluginStatsHref(primary.id, primary.plugin)
}

export type ContentModeSidebarNav = {
  overviewHref: string
  overviewLabel: string
  statsHref: string | null
  statsLabel: string
  flattenPluginNav: boolean
}

export async function resolveContentModeSidebarNav(): Promise<ContentModeSidebarNav> {
  if (isMultiTenantAdminEnabled()) {
    return {
      overviewHref: "/admin",
      overviewLabel: "Áttekintés",
      statsHref: "/admin/plugins/t-book/stats",
      statsLabel: "Statisztikák",
      flattenPluginNav: false,
    }
  }

  const plugins = await PluginService.listEnabledWithAdmin()
  const primary = pickPrimaryPlugin(plugins)

  if (!primary) {
    return {
      overviewHref: "/admin",
      overviewLabel: "Áttekintés",
      statsHref: null,
      statsLabel: "Statisztikák",
      flattenPluginNav: false,
    }
  }

  const statsHref = getPluginStatsHref(primary.id, primary.plugin)
  return {
    overviewHref: pluginAdminHref(primary.id, ""),
    overviewLabel: primary.name,
    statsHref,
    statsLabel: "Statisztikák",
    flattenPluginNav: plugins.length === 1,
  }
}

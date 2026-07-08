import { PluginService } from "@wse/core/services/plugin"
import { pluginAdminHref } from "@wse/sdk/plugins/types"
import type { PluginModule } from "@wse/sdk/plugins/types"

export type ShopDisabledAdminLanding =
  | { kind: "redirect"; href: string }
  | { kind: "hub"; plugins: Array<{ id: string; name: string; href: string }> }

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

/** Where `/admin` should go when `ENABLE_SHOP=false`. */
export async function resolveShopDisabledAdminLanding(): Promise<ShopDisabledAdminLanding> {
  const plugins = await PluginService.listEnabledWithAdmin()
  const primary = pickPrimaryPlugin(plugins)

  if (primary) {
    return { kind: "redirect", href: pluginAdminHref(primary.id, "") }
  }

  return {
    kind: "hub",
    plugins: plugins.map((p) => ({
      id: p.id,
      name: p.name,
      href: pluginAdminHref(p.id, ""),
    })),
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

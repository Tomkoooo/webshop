import { cache } from "react"
import { headers } from "next/headers"
import { FeatureFlagService } from "@wse/core/services/feature-flags"
import {
  getDeploymentDefinition,
  getPluginConfigForDeployment,
  isPluginAllowlistedForDeployment,
} from "@wse/core/config/deployments-registry"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import {
  getPluginById,
  listAllPlugins,
  loadPluginModule,
  type PluginRegistryEntry,
} from "@wse/core/plugins/registry"
import type { PluginModule } from "@wse/sdk/plugins/types"

export type EnabledPluginInfo = {
  id: string
  name: string
  manifest: PluginModule["manifest"]
  config: Record<string, unknown>
}

async function resolveHost(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get("host")
  } catch {
    return null
  }
}

const readEnabledPluginIds = cache(async (host: string | null): Promise<string[]> => {
  const deployment = getDeploymentDefinition(host)
  const allowlisted = deployment.enabledPlugins
  const results: string[] = []

  for (const pluginId of allowlisted) {
    let plugin: PluginModule
    try {
      plugin = await loadPluginModule(pluginId)
    } catch {
      continue
    }

    if (plugin.manifest.requiresShop && !isShopEnabled()) {
      continue
    }

    const flagKey = plugin.manifest.featureFlagKey
    if (flagKey) {
      const flagOn = await FeatureFlagService.isEnabled(flagKey, false)
      if (!flagOn) continue
    }

    results.push(pluginId)
  }

  return results
})

export class PluginService {
  static async getHost(): Promise<string | null> {
    return resolveHost()
  }

  static async isEnabled(pluginId: string): Promise<boolean> {
    const host = await resolveHost()
    if (!isPluginAllowlistedForDeployment(pluginId, host)) return false

    let plugin: PluginModule
    try {
      plugin = await loadPluginModule(pluginId)
    } catch {
      return false
    }

    if (plugin.manifest.requiresShop && !isShopEnabled()) return false

    const flagKey = plugin.manifest.featureFlagKey
    if (flagKey) {
      return FeatureFlagService.isEnabled(flagKey, false)
    }
    return true
  }

  /** Sync check: deployment allowlist only (no DB flags). Use in middleware. */
  static isAllowlisted(pluginId: string, host?: string | null): boolean {
    return isPluginAllowlistedForDeployment(pluginId, host)
  }

  static async getConfig(pluginId: string): Promise<Record<string, unknown>> {
    const host = await resolveHost()
    if (!(await PluginService.isEnabled(pluginId))) return {}
    return getPluginConfigForDeployment(pluginId, host)
  }

  static async loadEnabled(pluginId: string): Promise<PluginModule | null> {
    if (!(await PluginService.isEnabled(pluginId))) return null
    try {
      return await loadPluginModule(pluginId)
    } catch {
      return null
    }
  }

  static async listEnabled(): Promise<EnabledPluginInfo[]> {
    const host = await resolveHost()
    const ids = await readEnabledPluginIds(host)
    const entries: EnabledPluginInfo[] = []
    for (const id of ids) {
      const plugin = getPluginById(id)
      if (!plugin) continue
      entries.push({
        id,
        name: plugin.manifest.name,
        manifest: plugin.manifest,
        config: getPluginConfigForDeployment(id, host),
      })
    }
    return entries
  }

  static async listEnabledWithAdmin(): Promise<
    Array<EnabledPluginInfo & { plugin: PluginModule; navItems: NonNullable<PluginModule["admin"]>["navItems"] }>
  > {
    const enabled = await PluginService.listEnabled()
    const withAdmin: Array<
      EnabledPluginInfo & {
        plugin: PluginModule
        navItems: NonNullable<PluginModule["admin"]>["navItems"]
      }
    > = []
    for (const info of enabled) {
      const plugin = getPluginById(info.id)
      if (!plugin?.admin) continue
      withAdmin.push({
        ...info,
        plugin,
        navItems: plugin.admin.navItems,
      })
    }
    return withAdmin
  }

  static listRegistry(): PluginRegistryEntry[] {
    return listAllPlugins()
  }
}

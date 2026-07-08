import type { ComponentType } from "react"
import type { FlowRouteKey, FlowPageDefinition } from "../templates/types"
import type { EmailTemplateSeed } from "../contracts"

export type PluginManifest = {
  id: string
  name: string
  version: string
  description: string
  /**
   * When set, the plugin must be allowlisted in `deployments.config.json` **and**
   * this DB feature flag must be enabled (see `FeatureFlagService`).
   */
  featureFlagKey?: string
  /** When true, plugin admin/API surfaces require `ENABLE_SHOP` (not `"false"`). */
  requiresShop?: boolean
}

export type PluginAdminNavItem = {
  label: string
  /** Path under `/admin/plugins/{pluginId}/`, e.g. `""` or `events`. */
  segment: string
}

export type PluginAdminConfig = {
  navItems: PluginAdminNavItem[]
  Screen: ComponentType<PluginAdminScreenProps>
  /**
   * When `ENABLE_SHOP=false`, this plugin is preferred for `/admin` redirect and sidebar focus.
   */
  primaryWhenShopDisabled?: boolean
  /**
   * Statistics segment (e.g. `stats`). `/admin/stats` redirects here when the shop is off.
   */
  statsSegment?: string
}

export type PluginAdminScreenProps = {
  /** Remaining path segments after `/admin/plugins/{pluginId}/`. */
  path: string[]
  /** Deployment-specific config blob from `deployments.config.json`. */
  config: Record<string, unknown>
}

export type PluginApiContext = {
  pluginId: string
  path: string[]
  request: Request
  config: Record<string, unknown>
}

export type PluginStorefrontFlowOverrides = Partial<Record<FlowRouteKey, FlowPageDefinition>>

export interface PluginModule {
  manifest: PluginManifest
  /** Static email seeds (rare). Prefer getEmailTemplates for branding-dependent copy. */
  emailTemplates?: EmailTemplateSeed[]
  /** Async seeds merged on admin “initialize missing templates”. */
  getEmailTemplates?: () => Promise<EmailTemplateSeed[]>
  admin?: PluginAdminConfig
  api?: {
    handle(context: PluginApiContext): Promise<Response>
  }
  /**
   * Optional storefront flow overrides (cart/checkout/profile). Applied only when the
   * plugin is enabled for the active deployment.
   */
  storefront?: {
    flowPages?: PluginStorefrontFlowOverrides
  }
}

const SEMVER_RE = /^\d+\.\d+\.\d+/

export function definePlugin(plugin: PluginModule): PluginModule {
  const { manifest } = plugin
  if (!manifest.id?.trim()) {
    throw new Error("PluginModule.manifest.id is required")
  }
  if (!manifest.name?.trim()) {
    throw new Error(`Plugin '${manifest.id}': manifest.name is required`)
  }
  if (!SEMVER_RE.test(manifest.version)) {
    throw new Error(`Plugin '${manifest.id}': manifest.version must match semver (e.g. 1.0.0)`)
  }
  if (plugin.admin) {
    if (!plugin.admin.Screen || typeof plugin.admin.Screen !== "function") {
      throw new Error(`Plugin '${manifest.id}': admin.Screen must be a component`)
    }
    for (const item of plugin.admin.navItems) {
      if (item.segment.includes("/") || item.segment.startsWith(".")) {
        throw new Error(
          `Plugin '${manifest.id}': admin nav segment '${item.segment}' must be a single path segment`
        )
      }
    }
  }
  if (plugin.api?.handle && typeof plugin.api.handle !== "function") {
    throw new Error(`Plugin '${manifest.id}': api.handle must be a function`)
  }
  return plugin
}

/** Builds the admin href for a plugin nav item. */
export function pluginAdminHref(pluginId: string, segment: string): string {
  const base = `/admin/plugins/${pluginId}`
  if (!segment) return base
  return `${base}/${segment}`
}

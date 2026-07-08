import type { DeploymentDefinition } from "@wse/core/config/deployments-registry"

export type GuideSectionScope = "always" | "shop" | "shopDisabled"

export type GuideSectionVisibility = {
  scope: GuideSectionScope
  /** If set, section only appears on these deployment keys. */
  deploymentKeys?: string[]
  /** Show when ANY id is in deployment.allowedTemplates. */
  templateIds?: string[]
  /** Show when plugin is allowlisted on deployment AND runtime-enabled. */
  pluginIds?: string[]
}

export type GuideSectionDef = {
  id: string
  title: string
  file: string
  visibility: GuideSectionVisibility
}

export type GuideSectionContext = {
  deployment: DeploymentDefinition
  shopEnabled: boolean
  enabledPluginIds: Set<string>
}

export type LoadedGuideSection = {
  id: string
  title: string
  markdown: string
}

export type TemplateCmsPageRow = {
  label: string
  href: string
  category: string
}

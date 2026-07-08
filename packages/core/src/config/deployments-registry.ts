import deploymentsFile from "../../../../deployments.config.json"

/**
 * Canonical deployment → template/plugin access matrix for this build.
 * Edit `deployments.config.json` and register modules in:
 * - `src/templates/registry.ts`
 * - `src/plugins/registry.ts`
 *
 * Runtime selection: `DEPLOYMENT_KEY` env → `hostMap` → `defaultDeploymentKey`.
 */

export type DeploymentDefinition = {
  key: string
  label: string
  /** Template ids admins may activate on this deployment (must exist in template registry). */
  allowedTemplates: readonly string[]
  /** Suggested initial template when bootstrapping a new database. */
  defaultTemplateId: string
  /** Plugin ids enabled for this deployment (must exist in plugin registry). */
  enabledPlugins: readonly string[]
  pluginConfig: Record<string, Record<string, unknown>>
}

type RawDeployment = {
  key: string
  label?: string
  allowedTemplates?: string[]
  /** @deprecated Use `defaultTemplateId`. Kept for backward compatibility in JSON. */
  templateId?: string
  defaultTemplateId?: string
  enabledPlugins: string[]
  pluginConfig: Record<string, Record<string, unknown>>
}

type DeploymentsFile = {
  defaultDeploymentKey: string
  deployments: RawDeployment[]
  hostMap?: Record<string, string>
  /** Maps public host → template id (same deployment, shared DB, multiple containers). */
  hostTemplateMap?: Record<string, string>
}

/**
 * Engine v2 site apps bake their full deployment definition into the build via
 * `WSE_SITE_CONFIG_JSON` (see `wse create-site`). When present it is the sole
 * deployment for the process and `deployments.config.json` is ignored — the
 * legacy file remains only as the fallback for the reference app.
 */
type BakedSiteConfig = {
  id: string
  label?: string
  templateId: string
  allowedTemplates?: string[]
  plugins?: string[]
  pluginConfig?: Record<string, Record<string, unknown>>
}

function loadBakedSiteConfig(): DeploymentsFile | null {
  const raw = process.env.WSE_SITE_CONFIG_JSON?.trim()
  if (!raw) return null
  const cfg = JSON.parse(raw) as BakedSiteConfig
  return {
    defaultDeploymentKey: cfg.id,
    deployments: [
      {
        key: cfg.id,
        label: cfg.label ?? cfg.id,
        allowedTemplates:
          cfg.allowedTemplates && cfg.allowedTemplates.length > 0
            ? cfg.allowedTemplates
            : [cfg.templateId],
        defaultTemplateId: cfg.templateId,
        enabledPlugins: cfg.plugins ?? [],
        pluginConfig: cfg.pluginConfig ?? {},
      },
    ],
  }
}

const file = loadBakedSiteConfig() ?? (deploymentsFile as unknown as DeploymentsFile)

function normalizeDeployment(raw: RawDeployment): DeploymentDefinition {
  const defaultTemplateId = raw.defaultTemplateId ?? raw.templateId
  if (!defaultTemplateId) {
    throw new Error(
      `Deployment '${raw.key}' must set defaultTemplateId (or legacy templateId) in deployments.config.json`
    )
  }
  const allowedTemplates =
    raw.allowedTemplates && raw.allowedTemplates.length > 0
      ? raw.allowedTemplates
      : [defaultTemplateId]

  if (!allowedTemplates.includes(defaultTemplateId)) {
    throw new Error(
      `Deployment '${raw.key}': defaultTemplateId '${defaultTemplateId}' must be listed in allowedTemplates`
    )
  }

  return {
    key: raw.key,
    label: raw.label ?? raw.key,
    allowedTemplates,
    defaultTemplateId,
    enabledPlugins: raw.enabledPlugins ?? [],
    pluginConfig: raw.pluginConfig ?? {},
  }
}

export const DEPLOYMENTS_REGISTRY: readonly DeploymentDefinition[] = Object.freeze(
  file.deployments.map(normalizeDeployment)
)

export const DEFAULT_DEPLOYMENT_KEY = file.defaultDeploymentKey

const deploymentsByKey = new Map(DEPLOYMENTS_REGISTRY.map((d) => [d.key, d]))

const hostMap: Record<string, string> = file.hostMap ?? {}
const hostTemplateMap: Record<string, string> = file.hostTemplateMap ?? {}

function normalizeHost(host: string | null | undefined): string | null {
  if (!host) return null
  const normalized = host.split(":")[0]?.toLowerCase()
  if (!normalized) return null
  return normalized
}

function resolveDeploymentKeyFromHost(host: string | null | undefined): string | null {
  const normalized = normalizeHost(host)
  if (!normalized) return null
  return hostMap[normalized] ?? hostMap[host!.toLowerCase()] ?? null
}

/** Maps env typos/aliases (e.g. `nagyarcu_shop`) to canonical deployment keys. */
function resolveCanonicalDeploymentKey(raw: string): string {
  if (deploymentsByKey.has(raw)) return raw
  const hyphenated = raw.replace(/_/g, "-")
  if (hyphenated !== raw && deploymentsByKey.has(hyphenated)) return hyphenated
  return raw
}

export function getDeploymentKey(host?: string | null): string {
  const fromEnv = process.env.DEPLOYMENT_KEY?.trim()
  if (fromEnv) return resolveCanonicalDeploymentKey(fromEnv)
  const fromHost = resolveDeploymentKeyFromHost(host ?? null)
  if (fromHost) return resolveCanonicalDeploymentKey(fromHost)
  return DEFAULT_DEPLOYMENT_KEY
}

export function getDeploymentDefinition(host?: string | null): DeploymentDefinition {
  const key = getDeploymentKey(host)
  const entry = deploymentsByKey.get(key)
  if (!entry) {
    if (process.env.NODE_ENV !== "production" && key !== DEFAULT_DEPLOYMENT_KEY) {
      console.warn(
        `[deployments] Unknown DEPLOYMENT_KEY '${key}' — falling back to '${DEFAULT_DEPLOYMENT_KEY}'. ` +
          `Check deployments.config.json for valid keys.`
      )
    }
    const fallback = deploymentsByKey.get(DEFAULT_DEPLOYMENT_KEY)
    if (!fallback) {
      throw new Error(
        `Unknown deployment key '${key}' and no default '${DEFAULT_DEPLOYMENT_KEY}' in deployments.config.json`
      )
    }
    return fallback
  }
  return entry
}

export function listDeploymentDefinitions(): DeploymentDefinition[] {
  return [...DEPLOYMENTS_REGISTRY]
}

export function isTemplateAllowedForDeployment(
  templateId: string,
  host?: string | null
): boolean {
  const deployment = getDeploymentDefinition(host)
  return deployment.allowedTemplates.includes(templateId)
}

export function isPluginAllowlistedForDeployment(
  pluginId: string,
  host?: string | null
): boolean {
  const deployment = getDeploymentDefinition(host)
  return deployment.enabledPlugins.includes(pluginId)
}

export function getDefaultTemplateIdForDeployment(host?: string | null): string {
  return getPinnedTemplateIdForRequest(host) ?? getDeploymentDefinition(host).defaultTemplateId
}

/**
 * Fixed template for this request — from `TEMPLATE_PIN` env or `hostTemplateMap`.
 * Used when one deployment runs multiple landing templates on one DB (separate containers).
 */
export function getPinnedTemplateIdForRequest(host?: string | null): string | null {
  const deployment = getDeploymentDefinition(host)

  const fromEnv = process.env.TEMPLATE_PIN?.trim()
  if (fromEnv && deployment.allowedTemplates.includes(fromEnv)) {
    return fromEnv
  }

  const normalized = normalizeHost(host)
  if (normalized) {
    const fromHost = hostTemplateMap[normalized] ?? hostTemplateMap[host!.toLowerCase()]
    if (fromHost && deployment.allowedTemplates.includes(fromHost)) {
      return fromHost
    }
  }

  return null
}

export function listAllowedTemplateIdsForDeployment(host?: string | null): string[] {
  return [...getDeploymentDefinition(host).allowedTemplates]
}

export function listAllowlistedPluginIdsForDeployment(host?: string | null): string[] {
  return [...getDeploymentDefinition(host).enabledPlugins]
}

export function getPluginConfigForDeployment(
  pluginId: string,
  host?: string | null
): Record<string, unknown> {
  const deployment = getDeploymentDefinition(host)
  return deployment.pluginConfig[pluginId] ?? {}
}

/** Human- and agent-readable matrix of deployment access for this build. */
export function getDeploymentAccessMatrix(): Array<{
  key: string
  label: string
  allowedTemplates: string[]
  defaultTemplateId: string
  enabledPlugins: string[]
}> {
  return DEPLOYMENTS_REGISTRY.map((d) => ({
    key: d.key,
    label: d.label,
    allowedTemplates: [...d.allowedTemplates],
    defaultTemplateId: d.defaultTemplateId,
    enabledPlugins: [...d.enabledPlugins],
  }))
}

export function assertTemplateIdsKnown(
  templateIds: string[],
  registeredTemplateIds: readonly string[]
): void {
  const known = new Set(registeredTemplateIds)
  for (const id of templateIds) {
    if (!known.has(id)) {
      throw new Error(
        `Deployment references unknown template '${id}'. Register it in src/templates/registry.ts.`
      )
    }
  }
}

export function assertPluginIdsKnown(
  pluginIds: string[],
  registeredPluginIds: readonly string[]
): void {
  const known = new Set(registeredPluginIds)
  for (const id of pluginIds) {
    if (!known.has(id)) {
      throw new Error(
        `Deployment references unknown plugin '${id}'. Register it in src/plugins/registry.ts.`
      )
    }
  }
}

export function validateDeploymentsAgainstRegistries(options: {
  registeredTemplateIds: readonly string[]
  registeredPluginIds: readonly string[]
}): void {
  for (const deployment of DEPLOYMENTS_REGISTRY) {
    assertTemplateIdsKnown([...deployment.allowedTemplates, deployment.defaultTemplateId], options.registeredTemplateIds)
    assertPluginIdsKnown([...deployment.enabledPlugins], options.registeredPluginIds)
  }
  if (!deploymentsByKey.has(DEFAULT_DEPLOYMENT_KEY)) {
    throw new Error(
      `defaultDeploymentKey '${DEFAULT_DEPLOYMENT_KEY}' is missing from deployments.config.json`
    )
  }
}

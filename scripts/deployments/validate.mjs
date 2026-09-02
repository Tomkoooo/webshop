#!/usr/bin/env node
/**
 * Validates deployments.config.json against template and plugin registries.
 * Used in CI and locally: npm run deployments:validate
 */
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")

const config = JSON.parse(readFileSync(join(root, "deployments.config.json"), "utf8"))

const templateIds = new Set(["default-modern", "atelier-showcase", "minecraft-camp", "sakkmed", "cabinova", "erdweg", "keramia-fogfeherites", "keramia-implant", "eventstructure", "eventstructure-v2", "world-darts-festival", "dr-zsanett"])
const pluginIds = new Set(["camp-booking", "press-kit", "order-lab", "t-book"])

const errors = []

if (!config.defaultDeploymentKey) {
  errors.push("missing defaultDeploymentKey")
}

const keys = new Set()
for (const raw of config.deployments ?? []) {
  if (keys.has(raw.key)) errors.push(`duplicate deployment key '${raw.key}'`)
  keys.add(raw.key)

  const defaultTemplateId = raw.defaultTemplateId ?? raw.templateId
  if (!defaultTemplateId) {
    errors.push(`deployment '${raw.key}': missing defaultTemplateId`)
    continue
  }
  if (!templateIds.has(defaultTemplateId)) {
    errors.push(`deployment '${raw.key}': unknown defaultTemplateId '${defaultTemplateId}'`)
  }

  const allowed = raw.allowedTemplates?.length ? raw.allowedTemplates : [defaultTemplateId]
  for (const tid of allowed) {
    if (!templateIds.has(tid)) {
      errors.push(`deployment '${raw.key}': unknown allowedTemplates entry '${tid}'`)
    }
  }
  if (!allowed.includes(defaultTemplateId)) {
    errors.push(`deployment '${raw.key}': defaultTemplateId must be in allowedTemplates`)
  }

  for (const pid of raw.enabledPlugins ?? []) {
    if (!pluginIds.has(pid)) {
      errors.push(`deployment '${raw.key}': unknown enabledPlugins entry '${pid}'`)
    }
  }
}

if (!keys.has(config.defaultDeploymentKey)) {
  errors.push(`defaultDeploymentKey '${config.defaultDeploymentKey}' not found in deployments`)
}

const deploymentByKey = new Map((config.deployments ?? []).map((d) => [d.key, d]))
for (const [host, templateId] of Object.entries(config.hostTemplateMap ?? {})) {
  if (!templateIds.has(templateId)) {
    errors.push(`hostTemplateMap '${host}': unknown template '${templateId}'`)
    continue
  }
  const deploymentKey = config.hostMap?.[host]
  if (!deploymentKey) {
    errors.push(`hostTemplateMap '${host}': host missing from hostMap`)
    continue
  }
  const deployment = deploymentByKey.get(deploymentKey)
  if (!deployment) {
    errors.push(`hostTemplateMap '${host}': hostMap points to unknown deployment '${deploymentKey}'`)
    continue
  }
  const allowed = deployment.allowedTemplates?.length
    ? deployment.allowedTemplates
    : [deployment.defaultTemplateId ?? deployment.templateId]
  if (!allowed?.includes(templateId)) {
    errors.push(
      `hostTemplateMap '${host}': template '${templateId}' not in deployment '${deploymentKey}' allowedTemplates`
    )
  }
}

if (errors.length > 0) {
  console.error("deployments.config.json validation failed:\n")
  for (const e of errors) console.error(`  - ${e}`)
  console.error(
    "\nUpdate scripts/deployments/validate.mjs templateIds/pluginIds when adding registry entries."
  )
  process.exit(1)
}

console.log("deployments.config.json OK (%d deployments)", config.deployments.length)

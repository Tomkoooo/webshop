import { cache } from "react"
import dbConnect from "@wse/core/lib/db"
import ActiveTemplate from "@wse/core/models/ActiveTemplate"
import {
  FALLBACK_TEMPLATE_ID,
  getTemplateById,
  isRegisteredTemplateId,
  loadTemplateModule,
  listTemplates,
  listAllTemplates,
} from "@wse/core/templates/registry"
import { revalidateStorefrontTags, STOREFRONT_CACHE_TAGS } from "@wse/core/lib/storefront-cache-tags"
import type { TemplateModule } from "@wse/sdk/templates/types"
import { readPreviewTemplateId } from "@wse/core/services/template-preview"
import { ThemeService } from "@wse/core/services/theme"
import {
  getDefaultTemplateIdForDeployment,
  getDeploymentDefinition,
  getPinnedTemplateIdForRequest,
  isTemplateAllowedForDeployment,
  listAllowedTemplateIdsForDeployment,
} from "@wse/core/config/deployments-registry"
import { headers } from "next/headers"

export type ActiveTemplateInfo = {
  templateId: string
  templateVersion: string
  activatedAt: Date | null
  activatedBy: string | null
}

async function getRequestHost(): Promise<string | null> {
  try {
    const h = await headers()
    return h.get("host")
  } catch {
    return null
  }
}

const readActiveTemplateRecord = cache(async (): Promise<ActiveTemplateInfo> => {
  const host = await getRequestHost()
  const deployment = getDeploymentDefinition(host)

  const pinnedTemplateId = getPinnedTemplateIdForRequest(host)
  if (pinnedTemplateId) {
    const template = await loadTemplateModule(pinnedTemplateId)
    return {
      templateId: template.manifest.id,
      templateVersion: template.manifest.version,
      activatedAt: null,
      activatedBy: null,
    }
  }

  // One-template landing deployments always use their fixed template (no ActiveTemplate row).
  if (deployment.allowedTemplates.length === 1) {
    const templateId = deployment.allowedTemplates[0]!
    const template = await loadTemplateModule(templateId)
    return {
      templateId: template.manifest.id,
      templateVersion: template.manifest.version,
      activatedAt: null,
      activatedBy: null,
    }
  }

  await dbConnect()
  const doc = await ActiveTemplate.findOne({ key: "active" }).lean()
  if (!doc) {
    const deploymentDefault = getDefaultTemplateIdForDeployment(host)
    const templateId =
      isRegisteredTemplateId(deploymentDefault) ? deploymentDefault : FALLBACK_TEMPLATE_ID
    const template =
      getTemplateById(templateId) ?? getTemplateById(FALLBACK_TEMPLATE_ID)!
    return {
      templateId: template.manifest.id,
      templateVersion: template.manifest.version,
      activatedAt: null,
      activatedBy: null,
    }
  }
  return {
    templateId: doc.templateId,
    templateVersion: doc.templateVersion,
    activatedAt: doc.activatedAt ?? null,
    activatedBy: doc.activatedBy ?? null,
  }
})

export class TemplateService {
  static async getActiveInfo(): Promise<ActiveTemplateInfo> {
    return readActiveTemplateRecord()
  }

  static async getActive(): Promise<TemplateModule> {
    const previewId = await readPreviewTemplateId()
    if (previewId) {
      return loadTemplateModule(previewId)
    }
    const info = await readActiveTemplateRecord()
    return loadTemplateModule(info.templateId)
  }

  /** Active template from Mongo — ignores admin preview cookie (use for theme persistence). */
  static async getDbActive(): Promise<TemplateModule> {
    const info = await readActiveTemplateRecord()
    return loadTemplateModule(info.templateId)
  }

  static async getById(id: string): Promise<TemplateModule | null> {
    try {
      return await loadTemplateModule(id)
    } catch {
      return null
    }
  }

  static async listForDeployment(): Promise<TemplateModule[]> {
    const host = await getRequestHost()
    const allowed = new Set(listAllowedTemplateIdsForDeployment(host))
    const all = await listAllTemplates()
    return all.filter((t) => allowed.has(t.manifest.id))
  }

  /** @deprecated Use `listForDeployment()` — returns only templates allowed on this deployment. */
  static list(): TemplateModule[] {
    return listTemplates()
  }

  static async listAll(): Promise<TemplateModule[]> {
    return listAllTemplates()
  }

  static async getSuggestedTemplateId(): Promise<string> {
    const host = await getRequestHost()
    return getDefaultTemplateIdForDeployment(host)
  }

  static async activate(templateId: string, activatedBy?: string): Promise<TemplateModule> {
    const host = await getRequestHost()
    if (!isTemplateAllowedForDeployment(templateId, host)) {
      throw new Error(
        `Template '${templateId}' is not allowed for this deployment. Check deployments.config.json and DEPLOYMENT_KEY.`
      )
    }
    const template = await loadTemplateModule(templateId)
    await dbConnect()
    await ActiveTemplate.findOneAndUpdate(
      { key: "active" },
      {
        key: "active",
        templateId: template.manifest.id,
        templateVersion: template.manifest.version,
        activatedAt: new Date(),
        activatedBy,
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    )
    await ThemeService.clearStoredIfLegacySnapshot(template)
    revalidateStorefrontTags(STOREFRONT_CACHE_TAGS.template, STOREFRONT_CACHE_TAGS.theme)
    return template
  }
}

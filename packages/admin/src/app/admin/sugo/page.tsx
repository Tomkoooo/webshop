import { getDeploymentForAdmin } from "@wse/core/lib/admin-settings-access"
import { loadVisibleGuideSections } from "@wse/core/lib/admin-guide/resolve-sections"
import {
  buildCmsPagesMarkdownTable,
  editablePagesToRows,
} from "@wse/core/lib/admin-guide/template-cms-table"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { PluginService } from "@wse/core/services/plugin"
import { loadTemplateModule } from "@wse/core/templates/registry"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import { AdminGuideLayout } from "@wse/core/components/admin/guide/AdminGuideLayout"

export const dynamic = "force-dynamic"

const TEMPLATE_SECTION_IDS: Record<string, string> = {
  "default-modern": "template-default-modern",
  "atelier-showcase": "template-atelier-showcase",
  cabinova: "template-cabinova",
  "minecraft-camp": "template-minecraft-camp",
  sakkmed: "template-sakkmed",
}

export default async function AdminSugoPage() {
  const host = await PluginService.getHost()
  const deployment = getDeploymentForAdmin(host)
  const shopEnabled = isShopEnabled()
  const enabledPlugins = await PluginService.listEnabled()
  const enabledPluginIds = new Set(enabledPlugins.map((p) => p.id))

  const ctx = { deployment, shopEnabled, enabledPluginIds }
  const sections = await loadVisibleGuideSections(ctx)

  const campBookingEnabled = enabledPluginIds.has("camp-booking")
  const cmsTablesBySectionId = new Map<string, string>()

  await Promise.all(
    deployment.allowedTemplates.map(async (templateId) => {
      const sectionId = TEMPLATE_SECTION_IDS[templateId]
      if (!sectionId) return
      const template = await loadTemplateModule(templateId)
      const pages = listEditablePages(template, shopEnabled, campBookingEnabled)
      cmsTablesBySectionId.set(sectionId, buildCmsPagesMarkdownTable(editablePagesToRows(pages)))
    })
  )

  const enrichedSections = sections.map((section) => {
    const table = cmsTablesBySectionId.get(section.id)
    if (!table) return section
    return { ...section, markdown: `${section.markdown}${table}` }
  })

  return (
    <AdminGuideLayout sections={enrichedSections} deploymentLabel={deployment.label} />
  )
}

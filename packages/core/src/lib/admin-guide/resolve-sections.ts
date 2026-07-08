import type { GuideSectionContext, GuideSectionDef, LoadedGuideSection } from "@wse/core/lib/admin-guide/types"
import { ADMIN_GUIDE_SECTIONS } from "@wse/core/lib/admin-guide/manifest"
import { loadGuideSectionMarkdown } from "@wse/core/lib/admin-guide/load-section"

function matchesScope(
  scope: GuideSectionDef["visibility"]["scope"],
  ctx: GuideSectionContext
): boolean {
  if (scope === "always") return true
  if (scope === "shop") return ctx.shopEnabled
  if (scope === "shopDisabled") return !ctx.shopEnabled
  return false
}

function isSectionVisible(def: GuideSectionDef, ctx: GuideSectionContext): boolean {
  const { visibility } = def

  if (!matchesScope(visibility.scope, ctx)) return false

  if (visibility.deploymentKeys?.length) {
    if (!visibility.deploymentKeys.includes(ctx.deployment.key)) return false
  }

  if (visibility.templateIds?.length) {
    const allowed = new Set(ctx.deployment.allowedTemplates)
    if (!visibility.templateIds.some((id) => allowed.has(id))) return false
  }

  if (visibility.pluginIds?.length) {
    const allowlisted = new Set(ctx.deployment.enabledPlugins)
    if (
      !visibility.pluginIds.some(
        (id) => allowlisted.has(id) && ctx.enabledPluginIds.has(id)
      )
    ) {
      return false
    }
  }

  return true
}

export function resolveVisibleGuideSectionDefs(ctx: GuideSectionContext): GuideSectionDef[] {
  return ADMIN_GUIDE_SECTIONS.filter((def) => isSectionVisible(def, ctx))
}

export async function loadVisibleGuideSections(
  ctx: GuideSectionContext
): Promise<LoadedGuideSection[]> {
  const defs = resolveVisibleGuideSectionDefs(ctx)
  const sections = await Promise.all(
    defs.map(async (def) => ({
      id: def.id,
      title: def.title,
      markdown: await loadGuideSectionMarkdown(def.file),
    }))
  )
  return sections
}

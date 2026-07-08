import { TemplateService } from "@wse/core/services/template"
import { readPreviewTemplateId } from "@wse/core/services/template-preview"
import { getTemplateByIdAsync } from "@wse/core/templates/registry"
import { AdminTemplateSessionBar } from "@wse/core/components/admin/AdminTemplateSessionBar"

/** Server-only wrapper: template DB vs preview bar for CMS / templates admin areas. */
export async function AdminTemplateSessionBarSection() {
  const [activeInfo, previewTemplateId] = await Promise.all([
    TemplateService.getActiveInfo(),
    readPreviewTemplateId(),
  ])
  const [dbActiveTemplate, previewTemplate] = await Promise.all([
    getTemplateByIdAsync(activeInfo.templateId),
    previewTemplateId ? getTemplateByIdAsync(previewTemplateId) : Promise.resolve(null),
  ])
  const dbActiveName = dbActiveTemplate.manifest.name
  const previewTemplateName = previewTemplate?.manifest.name ?? null

  return (
    <AdminTemplateSessionBar
      dbActiveName={dbActiveName}
      previewTemplateId={previewTemplateId}
      previewTemplateName={previewTemplateName}
    />
  )
}

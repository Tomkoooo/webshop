import { TemplateService } from "@wse/core/services/template"
import { FlowRoutePageClient } from "@wse/core/components/flow-routes/FlowRoutePageClient"

export default async function ProfilePage() {
  const template = await TemplateService.getActive()
  return <FlowRoutePageClient templateId={template.manifest.id} flowRoute="profile" variant="page" />
}

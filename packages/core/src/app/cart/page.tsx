import { TemplateService } from "@wse/core/services/template"
import { FlowRoutePageClient } from "@wse/core/components/flow-routes/FlowRoutePageClient"
import { timeDevMetric } from "@wse/core/lib/dev-metrics"

export default async function CartPage() {
  const template = await timeDevMetric("cart.template", () => TemplateService.getActive(), {
    category: "page-data",
    route: "/cart",
  })
  return <FlowRoutePageClient templateId={template.manifest.id} flowRoute="cart" variant="page" />
}

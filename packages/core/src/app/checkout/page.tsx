import { TemplateService } from "@wse/core/services/template"
import { FlowRoutePageClient } from "@wse/core/components/flow-routes/FlowRoutePageClient"
import { timeDevMetric } from "@wse/core/lib/dev-metrics"

export default async function CheckoutPage() {
  const template = await timeDevMetric("checkout.template", () => TemplateService.getActive(), {
    category: "page-data",
    route: "/checkout",
  })
  return <FlowRoutePageClient templateId={template.manifest.id} flowRoute="checkout" variant="page" />
}

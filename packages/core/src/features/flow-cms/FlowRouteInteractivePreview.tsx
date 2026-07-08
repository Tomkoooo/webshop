"use client"

import type { FlowRouteKey } from "@wse/sdk/templates/types"
import { FALLBACK_TEMPLATE_ID } from "@wse/core/templates/registry"
import { FlowRoutePageClient } from "@wse/core/components/flow-routes/FlowRoutePageClient"

/**
 * Mounts the same interactive flow UI as live routes inside CMS / template shell previews
 * (respects `flowPages.*.RouteMain` when the template defines it).
 */
export function FlowRouteInteractivePreview({
  route,
  templateId = FALLBACK_TEMPLATE_ID,
}: {
  route: FlowRouteKey
  templateId?: string
}) {
  return <FlowRoutePageClient templateId={templateId} flowRoute={route} variant="embedded" />
}

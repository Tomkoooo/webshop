import { NextResponse } from "next/server"
import { requireManagementAuth } from "@wse/core/lib/management-auth"
import { getDeploymentKey, listAllowlistedPluginIdsForDeployment } from "@wse/core/config/deployments-registry"
import { TemplateService } from "@wse/core/services/template"
import { listRegisteredTemplateIds } from "@wse/core/templates/registry"

export const dynamic = "force-dynamic"

/** Site identity + health summary for the core-admin registry. */
export async function GET(request: Request) {
  const denied = requireManagementAuth(request)
  if (denied) return denied
  const template = await TemplateService.getDbActive()
  return NextResponse.json({
    ok: true,
    deploymentKey: getDeploymentKey(),
    activeTemplateId: template.manifest.id,
    activeTemplateVersion: template.manifest.version,
    registeredTemplates: listRegisteredTemplateIds(),
    enabledPlugins: listAllowlistedPluginIdsForDeployment(),
    engine: "wse-v2",
  })
}

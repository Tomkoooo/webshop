import {
  getDeploymentDefinition,
  isPluginAllowlistedForDeployment,
} from "@wse/core/config/deployments-registry"

export const PRESS_KIT_ROUTE_PREFIX = "sajto"

export function isPressKitPluginAllowlisted(host?: string | null): boolean {
  return isPluginAllowlistedForDeployment("press-kit", host)
}

export function isPressKitPath(pathname: string): boolean {
  return pathname === `/${PRESS_KIT_ROUTE_PREFIX}` || pathname.startsWith(`/${PRESS_KIT_ROUTE_PREFIX}/`)
}

export function getPressKitRoutePrefix(host?: string | null): string {
  const deployment = getDeploymentDefinition(host)
  const cfg = deployment.pluginConfig["press-kit"]
  const prefix = cfg?.routePrefix
  return typeof prefix === "string" && prefix.trim() ? prefix.trim().replace(/^\/+|\/+$/g, "") : PRESS_KIT_ROUTE_PREFIX
}

export function isPressKitPathForDeployment(pathname: string, host?: string | null): boolean {
  const prefix = getPressKitRoutePrefix(host)
  return pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`)
}

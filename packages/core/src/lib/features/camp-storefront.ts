import {
  getDeploymentDefinition,
  getPluginConfigForDeployment,
} from "@wse/core/config/deployments-registry"

export function isCampOnlyStorefront(host?: string | null): boolean {
  const deployment = getDeploymentDefinition(host)
  if (!deployment.enabledPlugins.includes("camp-booking")) return false
  const cfg = getPluginConfigForDeployment("camp-booking", host)
  return cfg.storefrontMode === "campOnly"
}

/** Paths blocked when camp-only mode is active. */
export const CAMP_ONLY_BLOCKED_PREFIXES = [
  "/shop",
  "/products",
  "/cart",
  "/checkout",
  "/profile",
] as const

export function isCampOnlyBlockedPath(pathname: string): boolean {
  return CAMP_ONLY_BLOCKED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
}

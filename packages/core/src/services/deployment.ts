/**
 * @deprecated Import from `@/config/deployments-registry` instead.
 * Re-exports kept for backward compatibility during the plugin rollout.
 */
export {
  getDeploymentKey,
  getDeploymentDefinition as getDeploymentConfig,
  listDeploymentDefinitions as listDeploymentConfigs,
  isPluginAllowlistedForDeployment as isPluginAllowlisted,
  getPluginConfigForDeployment,
  getDefaultTemplateIdForDeployment as getSuggestedTemplateId,
  assertPluginIdsKnown,
  assertTemplateIdsKnown,
  isTemplateAllowedForDeployment,
  listAllowedTemplateIdsForDeployment,
  listAllowlistedPluginIdsForDeployment,
  getDeploymentAccessMatrix,
  type DeploymentDefinition as DeploymentConfigEntry,
} from "@wse/core/config/deployments-registry"

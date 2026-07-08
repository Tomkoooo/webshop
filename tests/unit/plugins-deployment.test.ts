import { describe, expect, it, beforeEach, afterEach } from "vitest"
import {
  getDeploymentDefinition,
  getDeploymentKey,
  getPluginConfigForDeployment,
  isPluginAllowlistedForDeployment,
  listAllowedTemplateIdsForDeployment,
} from "@wse/core/config/deployments-registry"

describe("deployment config", () => {
  const originalKey = process.env.DEPLOYMENT_KEY

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.DEPLOYMENT_KEY
    } else {
      process.env.DEPLOYMENT_KEY = originalKey
    }
  })

  it("defaults to default deployment key", () => {
    delete process.env.DEPLOYMENT_KEY
    expect(getDeploymentKey()).toBe("default")
    expect(getDeploymentDefinition().enabledPlugins).toEqual([])
    expect(listAllowedTemplateIdsForDeployment()).toContain("default-modern")
  })

  it("selects minecraft-camp deployment via DEPLOYMENT_KEY", () => {
    process.env.DEPLOYMENT_KEY = "minecraft-camp"
    const config = getDeploymentDefinition()
    expect(config.key).toBe("minecraft-camp")
    expect(config.enabledPlugins).toContain("camp-booking")
    expect(getPluginConfigForDeployment("camp-booking").currency).toBe("HUF")
  })

  it("allowlists plugins per deployment", () => {
    process.env.DEPLOYMENT_KEY = "default"
    expect(isPluginAllowlistedForDeployment("camp-booking")).toBe(false)
    process.env.DEPLOYMENT_KEY = "minecraft-camp"
    expect(isPluginAllowlistedForDeployment("camp-booking")).toBe(true)
  })

  it("selects nagyarcu-shop deployment with press-kit and order-lab", () => {
    process.env.DEPLOYMENT_KEY = "nagyarcu-shop"
    const config = getDeploymentDefinition()
    expect(config.key).toBe("nagyarcu-shop")
    expect(config.enabledPlugins).toContain("press-kit")
    expect(config.enabledPlugins).toContain("order-lab")
    expect(getPluginConfigForDeployment("press-kit").routePrefix).toBe("sajto")
    expect(isPluginAllowlistedForDeployment("press-kit")).toBe(true)
    expect(isPluginAllowlistedForDeployment("order-lab")).toBe(true)
  })
})

import { describe, expect, it, afterEach } from "vitest"
import {
  getDeploymentAccessMatrix,
  getDeploymentDefinition,
  getDeploymentKey,
  isPluginAllowlistedForDeployment,
  isTemplateAllowedForDeployment,
  listAllowedTemplateIdsForDeployment,
} from "@wse/core/config/deployments-registry"

describe("deployments-registry", () => {
  const originalKey = process.env.DEPLOYMENT_KEY

  afterEach(() => {
    if (originalKey === undefined) delete process.env.DEPLOYMENT_KEY
    else process.env.DEPLOYMENT_KEY = originalKey
  })

  it("exposes a non-empty access matrix", () => {
    const matrix = getDeploymentAccessMatrix()
    expect(matrix.length).toBeGreaterThan(0)
    expect(matrix.some((d) => d.key === "default")).toBe(true)
    expect(matrix.some((d) => d.key === "minecraft-camp")).toBe(true)
  })

  it("default deployment allows both registered templates", () => {
    delete process.env.DEPLOYMENT_KEY
    const ids = listAllowedTemplateIdsForDeployment()
    expect(ids).toContain("default-modern")
    expect(ids).toContain("atelier-showcase")
    expect(getDeploymentDefinition().enabledPlugins).toEqual(["t-book"])
  })

  it("minecraft-camp allowlists camp-booking plugin and template", () => {
    process.env.DEPLOYMENT_KEY = "minecraft-camp"
    expect(isPluginAllowlistedForDeployment("camp-booking")).toBe(true)
    expect(isPluginAllowlistedForDeployment("unknown")).toBe(false)
    expect(isTemplateAllowedForDeployment("minecraft-camp")).toBe(true)
    expect(getDeploymentKey()).toBe("minecraft-camp")
  })

  it("resolves underscore DEPLOYMENT_KEY aliases to hyphenated keys", () => {
    process.env.DEPLOYMENT_KEY = "nagyarcu_shop"
    expect(getDeploymentKey()).toBe("nagyarcu-shop")
    expect(getDeploymentDefinition().enabledPlugins).toContain("press-kit")
    expect(isPluginAllowlistedForDeployment("press-kit")).toBe(true)
  })
})

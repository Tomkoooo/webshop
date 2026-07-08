import { describe, expect, it } from "vitest"
import { resolveVisibleGuideSectionDefs } from "@wse/core/lib/admin-guide/resolve-sections"
import type { GuideSectionContext } from "@wse/core/lib/admin-guide/types"
import type { DeploymentDefinition } from "@wse/core/config/deployments-registry"

const cabinova: DeploymentDefinition = {
  key: "cabinova",
  label: "Cabinova",
  allowedTemplates: ["cabinova"],
  defaultTemplateId: "cabinova",
  enabledPlugins: [],
  pluginConfig: {},
}

const defaultDeployment: DeploymentDefinition = {
  key: "default",
  label: "Default",
  allowedTemplates: ["default-modern", "atelier-showcase"],
  defaultTemplateId: "default-modern",
  enabledPlugins: [],
  pluginConfig: {},
}

const minecraftCamp: DeploymentDefinition = {
  key: "minecraft-camp",
  label: "Minecraft",
  allowedTemplates: ["minecraft-camp"],
  defaultTemplateId: "minecraft-camp",
  enabledPlugins: ["camp-booking"],
  pluginConfig: {},
}

const nagyarcuShop: DeploymentDefinition = {
  key: "nagyarcu-shop",
  label: "Nagy Árcu",
  allowedTemplates: ["default-modern", "atelier-showcase"],
  defaultTemplateId: "default-modern",
  enabledPlugins: ["press-kit", "order-lab"],
  pluginConfig: {},
}

function ctx(
  deployment: DeploymentDefinition,
  shopEnabled: boolean,
  enabledPluginIds: string[] = []
): GuideSectionContext {
  return {
    deployment,
    shopEnabled,
    enabledPluginIds: new Set(enabledPluginIds),
  }
}

describe("resolveVisibleGuideSectionDefs", () => {
  it("always includes intro and sugo-related shared sections for cabinova", () => {
    const ids = resolveVisibleGuideSectionDefs(ctx(cabinova, true)).map((s) => s.id)
    expect(ids).toContain("intro")
    expect(ids).toContain("template-cabinova")
    expect(ids).not.toContain("template-sakkmed")
    expect(ids).not.toContain("plugin-camp-booking")
  })

  it("includes shop sections when shop enabled", () => {
    const ids = resolveVisibleGuideSectionDefs(ctx(defaultDeployment, true)).map((s) => s.id)
    expect(ids).toContain("shop-basics")
  })

  it("excludes shop sections when shop disabled on minecraft-camp", () => {
    const ids = resolveVisibleGuideSectionDefs(
      ctx(minecraftCamp, false, ["camp-booking"])
    ).map((s) => s.id)
    expect(ids).not.toContain("shop-basics")
    expect(ids).toContain("camp-shop-disabled")
    expect(ids).toContain("plugin-camp-booking")
  })

  it("shows plugin section only when runtime enabled", () => {
    const allowlisted = resolveVisibleGuideSectionDefs(ctx(nagyarcuShop, true)).map(
      (s) => s.id
    )
    expect(allowlisted).not.toContain("plugin-press-kit")

    const enabled = resolveVisibleGuideSectionDefs(
      ctx(nagyarcuShop, true, ["press-kit", "order-lab"])
    ).map((s) => s.id)
    expect(enabled).toContain("plugin-press-kit")
    expect(enabled).toContain("plugin-order-lab")
  })
})

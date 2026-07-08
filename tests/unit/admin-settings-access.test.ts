import { describe, expect, it } from "vitest"
import {
  getAccessibleAdminFlagKeys,
  getAccessiblePluginFeatureFlagKeys,
  getAccessiblePluginSettings,
  shouldShowShopOrderContactEmails,
} from "@wse/core/lib/admin-settings-access"
import type { DeploymentDefinition } from "@wse/core/config/deployments-registry"

const minecraftCamp: DeploymentDefinition = {
  key: "minecraft-camp",
  label: "Minecraft",
  allowedTemplates: ["minecraft-camp"],
  defaultTemplateId: "minecraft-camp",
  enabledPlugins: ["camp-booking"],
  pluginConfig: {
    "camp-booking": { storefrontMode: "campOnly", currency: "HUF" },
  },
}

const defaultDeployment: DeploymentDefinition = {
  key: "default",
  label: "Default",
  allowedTemplates: ["default-modern"],
  defaultTemplateId: "default-modern",
  enabledPlugins: [],
  pluginConfig: {},
}

describe("admin-settings-access", () => {
  it("hides shop-only flags when shop is off", () => {
    const keys = getAccessibleAdminFlagKeys(minecraftCamp, false)
    expect(keys).toContain("maintenanceMode")
    expect(keys).toContain("stripePayments")
    expect(keys).not.toContain("shopPage")
    expect(keys).not.toContain("glsParcelPicker")
  })

  it("shows shop flags when shop is on", () => {
    const keys = getAccessibleAdminFlagKeys(defaultDeployment, true)
    expect(keys).toContain("shopPage")
    expect(keys).toContain("glsParcelPicker")
  })

  it("lists plugin settings for allowlisted plugins", () => {
    const plugins = getAccessiblePluginSettings(minecraftCamp, { pluginCampBooking: false })
    expect(plugins).toHaveLength(1)
    expect(plugins[0].pluginId).toBe("camp-booking")
    expect(plugins[0].config.currency).toBe("HUF")
    expect(plugins[0].featureFlagKey).toBe("pluginCampBooking")
  })

  it("exposes plugin feature flag keys separately from general flags", () => {
    expect(getAccessiblePluginFeatureFlagKeys(minecraftCamp)).toEqual(["pluginCampBooking"])
  })

  it("hides shop order contact emails when shop is off", () => {
    expect(shouldShowShopOrderContactEmails(false)).toBe(false)
    expect(shouldShowShopOrderContactEmails(true)).toBe(true)
  })
})

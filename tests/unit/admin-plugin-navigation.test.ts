import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"

vi.mock("@wse/core/services/plugin", () => ({
  PluginService: {
    getHost: vi.fn(async () => null),
    listEnabledWithAdmin: vi.fn(),
  },
}))

vi.mock("@wse/core/config/deployments-registry", () => ({
  getDeploymentDefinition: vi.fn(() => ({
    key: "default",
    enabledPlugins: ["t-book"],
  })),
  isPluginAllowlistedForDeployment: vi.fn(() => true),
}))

vi.mock("@wse/core/plugins/registry", () => ({
  loadPluginModule: vi.fn(async (id: string) => ({
    manifest: {
      id,
      name: "tBook",
      featureFlagKey: "pluginTBook",
      requiresShop: false,
    },
    admin: { primaryWhenShopDisabled: true, Screen: () => null, navItems: [] },
  })),
}))

vi.mock("@wse/core/services/feature-flags", () => ({
  FeatureFlagService: {
    isEnabled: vi.fn(async () => false),
  },
}))

import { PluginService } from "@wse/core/services/plugin"
import { resolveShopDisabledAdminLanding } from "@wse/core/lib/admin-plugin-navigation"

describe("resolveShopDisabledAdminLanding", () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("redirects to the primary plugin when it is enabled", async () => {
    vi.mocked(PluginService.listEnabledWithAdmin).mockResolvedValue([
      {
        id: "t-book",
        name: "tBook",
        manifest: { id: "t-book", name: "tBook", version: "1.0.0", description: "" },
        config: {},
        plugin: {
          manifest: { id: "t-book", name: "tBook", version: "1.0.0", description: "" },
          admin: { primaryWhenShopDisabled: true, Screen: () => null, navItems: [] },
        },
        navItems: [],
      },
    ])

    const landing = await resolveShopDisabledAdminLanding()
    expect(landing).toEqual({ kind: "redirect", href: "/admin/plugins/t-book" })
  })

  it("returns a hub with pending plugins instead of sending users to CMS", async () => {
    vi.mocked(PluginService.listEnabledWithAdmin).mockResolvedValue([])

    const landing = await resolveShopDisabledAdminLanding()
    expect(landing.kind).toBe("hub")
    if (landing.kind !== "hub") return
    expect(landing.plugins).toEqual([])
    expect(landing.pendingPlugins).toEqual([
      {
        id: "t-book",
        name: "tBook",
        settingsHref: "/admin/info",
      },
    ])
  })
})

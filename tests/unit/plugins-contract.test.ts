import { describe, expect, it } from "vitest"
import { listRegisteredPluginIds, loadPluginModule } from "@wse/core/plugins/registry"
import { definePlugin, pluginAdminHref } from "@wse/sdk/plugins/types"
import { parsePluginAdminPath, parsePluginApiPath } from "@wse/core/lib/features/plugins"

describe("plugin registry contract", () => {
  const pluginIds = listRegisteredPluginIds()

  it("registers camp-booking plugin", () => {
    expect(pluginIds).toContain("camp-booking")
  })

  it("registers order-lab plugin", () => {
    expect(pluginIds).toContain("order-lab")
  })

  for (const id of pluginIds) {
    describe(`plugin '${id}'`, () => {
      it("manifest id matches registry key", async () => {
        const module = await loadPluginModule(id)
        expect(module.manifest.id).toBe(id)
      })

      it("has semver version", async () => {
        const module = await loadPluginModule(id)
        expect(module.manifest.version).toMatch(/^\d+\.\d+\.\d+/)
      })

      it("admin nav segments are valid when admin is defined", async () => {
        const module = await loadPluginModule(id)
        if (!module.admin) return
        for (const item of module.admin.navItems) {
          expect(item.segment).not.toContain("/")
        }
        expect(typeof module.admin.Screen).toBe("function")
      })

      it("api handle is a function when api is defined", async () => {
        const module = await loadPluginModule(id)
        if (!module.api) return
        expect(typeof module.api.handle).toBe("function")
      })
    })
  }
})

describe("definePlugin validation", () => {
  it("rejects invalid semver", () => {
    expect(() =>
      definePlugin({
        manifest: {
          id: "bad",
          name: "Bad",
          version: "not-semver",
          description: "x",
        },
      })
    ).toThrow()
  })
})

describe("plugin path helpers", () => {
  it("parses admin paths", () => {
    expect(parsePluginAdminPath("/admin/plugins/camp-booking/camps")).toEqual({
      pluginId: "camp-booking",
      path: ["camps"],
    })
  })

  it("parses api paths", () => {
    expect(parsePluginApiPath("/api/plugins/camp-booking/admin/dashboard")).toEqual({
      pluginId: "camp-booking",
      path: ["admin", "dashboard"],
    })
  })

  it("builds admin hrefs", () => {
    expect(pluginAdminHref("camp-booking", "")).toBe("/admin/plugins/camp-booking")
    expect(pluginAdminHref("camp-booking", "camps")).toBe("/admin/plugins/camp-booking/camps")
  })
})

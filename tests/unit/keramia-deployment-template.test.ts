import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { getPinnedTemplateIdForRequest } from "@wse/core/config/deployments-registry"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import { keramiaFogfeherites } from "@wse/template-keramia-fogfeherites/template.config"

describe("Kerámia dental deployment (shared DB, pinned templates)", () => {
  const originalDeploymentKey = process.env.DEPLOYMENT_KEY
  const originalTemplatePin = process.env.TEMPLATE_PIN

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    if (originalDeploymentKey === undefined) delete process.env.DEPLOYMENT_KEY
    else process.env.DEPLOYMENT_KEY = originalDeploymentKey
    if (originalTemplatePin === undefined) delete process.env.TEMPLATE_PIN
    else process.env.TEMPLATE_PIN = originalTemplatePin
  })

  it("keramia-dental allows both landing templates", async () => {
    process.env.DEPLOYMENT_KEY = "keramia-dental"
    const { listAllowedTemplateIdsForDeployment } = await import("@wse/core/config/deployments-registry")
    const ids = listAllowedTemplateIdsForDeployment()
    expect(ids).toContain("keramia-fogfeherites")
    expect(ids).toContain("keramia-implant")
  })

  it("resolves fogfeherites via TEMPLATE_PIN on keramia-dental", async () => {
    process.env.DEPLOYMENT_KEY = "keramia-dental"
    process.env.TEMPLATE_PIN = "keramia-fogfeherites"
    const { TemplateService } = await import("@wse/core/services/template")
    const info = await TemplateService.getActiveInfo()
    expect(info.templateId).toBe("keramia-fogfeherites")
  })

  it("resolves implant via TEMPLATE_PIN on keramia-dental", async () => {
    process.env.DEPLOYMENT_KEY = "keramia-dental"
    process.env.TEMPLATE_PIN = "keramia-implant"
    const { TemplateService } = await import("@wse/core/services/template")
    const info = await TemplateService.getActiveInfo()
    expect(info.templateId).toBe("keramia-implant")
  })

  it("resolves template from hostTemplateMap when host is mapped", () => {
    process.env.DEPLOYMENT_KEY = "keramia-dental"
    delete process.env.TEMPLATE_PIN
    expect(
      getPinnedTemplateIdForRequest("fogfeherites.keramiadental.hu")
    ).toBe("keramia-fogfeherites")
    expect(getPinnedTemplateIdForRequest("implant.keramiadental.hu")).toBe("keramia-implant")
  })

  it("lists surface-json home CMS for campaign landing templates", () => {
    const pages = listEditablePages(keramiaFogfeherites, false)
    const home = pages.find((p) => p.adminSegment === "home")
    expect(home).toMatchObject({
      pageKey: "page:home",
      editorKind: "surface-json",
    })
  })
})

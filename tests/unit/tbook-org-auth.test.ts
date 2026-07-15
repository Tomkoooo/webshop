import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const CORE_APP = path.join(process.cwd(), "packages/core/src/app")
const TBOOK_APP = path.join(process.cwd(), "apps/tbook/src/app")

describe("tBook site app route stubs", () => {
  it("includes multi-tenant org and auth routes synced from engine packages", () => {
    const required = [
      "admin/org/select/page.tsx",
      "admin/org/members/page.tsx",
      "admin/org/roles/page.tsx",
      "admin/org/settings/page.tsx",
      "admin/system/page.tsx",
      "admin/system/organizations/[id]/page.tsx",
      "auth/invite/page.tsx",
      "auth/no-admin-access/page.tsx",
    ]
    for (const rel of required) {
      expect(fs.existsSync(path.join(TBOOK_APP, rel)), `missing ${rel}`).toBe(true)
    }
  })

  it("uses route handler for admin OAuth callback (no page.tsx cookie writes)", () => {
    expect(fs.existsSync(path.join(CORE_APP, "auth/admin-callback/route.ts"))).toBe(true)
    expect(fs.existsSync(path.join(CORE_APP, "auth/admin-callback/page.tsx"))).toBe(false)
  })
})

describe("CMS editor template resolution", () => {
  it("loads active DB template in CMS routes (ignores preview cookie)", () => {
    const cmsPage = fs.readFileSync(
      path.join(process.cwd(), "packages/admin/src/app/admin/cms/[pageKey]/page.tsx"),
      "utf8"
    )
    expect(cmsPage).toContain("TemplateService.getDbActive()")
    expect(cmsPage).not.toContain("TemplateService.getActive()")
  })
})

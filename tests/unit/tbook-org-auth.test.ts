import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

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
      "auth/admin-callback/page.tsx",
      "auth/invite/page.tsx",
      "auth/no-admin-access/page.tsx",
    ]
    for (const rel of required) {
      expect(fs.existsSync(path.join(TBOOK_APP, rel)), `missing ${rel}`).toBe(true)
    }
  })
})

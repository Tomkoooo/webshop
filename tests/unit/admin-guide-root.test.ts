import { describe, expect, it } from "vitest"
import { resolveAdminGuideRoot } from "@wse/core/lib/admin-guide/resolve-guide-root"
import fs from "fs"
import path from "path"

describe("resolveAdminGuideRoot", () => {
  it("finds docs/admin-user-guide from repo cwd", () => {
    const root = resolveAdminGuideRoot()
    expect(fs.existsSync(path.join(root, "sections/00-bevezetes.md"))).toBe(true)
  })
})

import { describe, expect, it } from "vitest"
import {
  adminTokensToCssVars,
  DEFAULT_ADMIN_LAYOUT,
  DEFAULT_ADMIN_TOKENS,
} from "@wse/sdk/admin"

describe("adminTokensToCssVars", () => {
  it("maps camelCase token keys to --admin-kebab-case CSS variables", () => {
    const vars = adminTokensToCssVars(DEFAULT_ADMIN_TOKENS, DEFAULT_ADMIN_LAYOUT)
    expect(vars["--admin-background"]).toContain("oklch")
    expect(vars["--admin-surface-raised"]).toContain("oklch")
    expect(vars["--admin-accent-muted"]).toContain("oklch")
    expect(vars["--admin-sidebar-width"]).toBe("16rem")
  })
})

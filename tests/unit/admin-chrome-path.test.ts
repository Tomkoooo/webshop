import { describe, expect, it } from "vitest"
import { isAdminChromePath } from "@wse/core/lib/admin-chrome-path"

describe("isAdminChromePath", () => {
  it("matches admin and admin-login paths", () => {
    expect(isAdminChromePath("/admin")).toBe(true)
    expect(isAdminChromePath("/admin/orders")).toBe(true)
    expect(isAdminChromePath("/auth/admin-login")).toBe(true)
    expect(isAdminChromePath("/shop")).toBe(false)
    expect(isAdminChromePath("/")).toBe(false)
  })
})

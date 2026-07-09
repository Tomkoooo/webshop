import { describe, expect, it } from "vitest"
import { isNavItemActive, resolveActiveNavHref } from "@wse/core/lib/admin-active-nav"

describe("admin-active-nav", () => {
  it("picks the longest matching href", () => {
    const hrefs = ["/admin", "/admin/orders", "/admin/products"]
    expect(resolveActiveNavHref("/admin/orders/abc", hrefs)).toBe("/admin/orders")
    expect(isNavItemActive("/admin/orders/abc", "/admin/orders", hrefs)).toBe(true)
    expect(isNavItemActive("/admin/orders/abc", "/admin", hrefs)).toBe(false)
  })
})

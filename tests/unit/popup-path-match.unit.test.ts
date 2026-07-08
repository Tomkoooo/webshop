import { describe, expect, it } from "vitest"
import {
  matchesTargetPath,
  matchesAnyTargetPath,
  normalizePathname,
  parseTargetPath,
} from "@wse/core/lib/popup-path-match"

describe("normalizePathname", () => {
  it("normalizes root and trailing slashes", () => {
    expect(normalizePathname("/")).toBe("/")
    expect(normalizePathname("/shop/")).toBe("/shop")
    expect(normalizePathname("shop")).toBe("/shop")
  })
})

describe("parseTargetPath", () => {
  it("splits path and query", () => {
    const { pathname, searchParams } = parseTargetPath("/shop?category=abc&page=2")
    expect(pathname).toBe("/shop")
    expect(searchParams?.get("category")).toBe("abc")
    expect(searchParams?.get("page")).toBe("2")
  })
})

describe("matchesTargetPath", () => {
  it("matches home", () => {
    expect(matchesTargetPath("/", "", "/")).toBe(true)
    expect(matchesTargetPath("/", "", "/home")).toBe(false)
  })

  it("matches shop without query for any shop query", () => {
    expect(matchesTargetPath("/shop", "?category=cat1", "/shop")).toBe(true)
    expect(matchesTargetPath("/shop", "?category=cat1&page=2", "/shop")).toBe(true)
  })

  it("matches shop with specific category query", () => {
    expect(
      matchesTargetPath("/shop", "?category=cat1", "/shop?category=cat1")
    ).toBe(true)
    expect(
      matchesTargetPath("/shop", "?category=cat2", "/shop?category=cat1")
    ).toBe(false)
    expect(
      matchesTargetPath("/shop", "?category=cat1&page=2", "/shop?category=cat1")
    ).toBe(true)
  })

  it("matches product slug", () => {
    expect(
      matchesTargetPath("/products/my-product", "", "/products/my-product")
    ).toBe(true)
    expect(
      matchesTargetPath("/products/other", "", "/products/my-product")
    ).toBe(false)
  })

  it("matches static page", () => {
    expect(matchesTargetPath("/editorial", "", "/editorial")).toBe(true)
  })
})

describe("matchesAnyTargetPath", () => {
  it("returns true when any target matches", () => {
    expect(
      matchesAnyTargetPath("/", "", ["/shop", "/"])
    ).toBe(true)
    expect(
      matchesAnyTargetPath("/cart", "", ["/shop", "/"])
    ).toBe(false)
  })
})

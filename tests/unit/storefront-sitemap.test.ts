import { describe, expect, it } from "vitest"
import { buildStorefrontSitemapEntries } from "@wse/core/lib/sitemap/build-storefront-sitemap"
import type { TemplateModule } from "@wse/sdk/templates/types"

function mockTemplate(overrides: Partial<TemplateModule["manifest"]> & { staticSlugs?: string[] }): TemplateModule {
  const staticSlugs = overrides.staticSlugs ?? []
  return {
    manifest: {
      id: "test",
      name: "Test",
      version: "1",
      author: "test",
      description: "test",
      screenshots: [],
      capabilities: {
        hasBlog: false,
        staticPages: staticSlugs,
        restyles: ["home", "shop", "pdp"],
      },
      surfaces: {
        home: { adminSegment: "home", category: "landing" },
        shop: { adminSegment: "shop", category: "shop" },
        pdp: { adminSegment: "pdp", category: "shop" },
      },
      deployment: overrides.deployment ?? "commerce",
      ...overrides,
    },
    chrome: {} as TemplateModule["chrome"],
    pages: {} as TemplateModule["pages"],
    staticPages: Object.fromEntries(
      staticSlugs.map((slug) => [slug, {} as TemplateModule["staticPages"][string]])
    ),
  } as TemplateModule
}

describe("buildStorefrontSitemapEntries", () => {
  it("includes home and template static pages", () => {
    const entries = buildStorefrontSitemapEntries({
      baseUrl: "https://shop.test",
      template: mockTemplate({ staticSlugs: ["about", "editorial/journal"] }),
      shopEnabled: false,
    })
    const urls = entries.map((e) => e.url)
    expect(urls).toContain("https://shop.test/")
    expect(urls).toContain("https://shop.test/about")
    expect(urls).toContain("https://shop.test/editorial/journal")
    expect(urls.some((u) => new URL(u).pathname.startsWith("/shop"))).toBe(false)
  })

  it("includes shop, products, and category filters when commerce is enabled", () => {
    const entries = buildStorefrontSitemapEntries({
      baseUrl: "https://shop.test",
      template: mockTemplate({ staticSlugs: [] }),
      shopEnabled: true,
      products: [{ slug: "hammer", updatedAt: "2026-01-01" }],
      categories: [{ id: "cat1", slug: "tools", updatedAt: "2026-01-02" }],
    })
    const urls = entries.map((e) => e.url)
    expect(urls).toContain("https://shop.test/shop")
    expect(urls).toContain("https://shop.test/products/hammer")
    expect(urls).toContain("https://shop.test/shop?category=cat1")
    expect(urls.some((u) => new URL(u).pathname === "/cart")).toBe(false)
  })

  it("skips commerce routes for landing-only templates", () => {
    const entries = buildStorefrontSitemapEntries({
      baseUrl: "https://shop.test",
      template: mockTemplate({ deployment: "landing", staticSlugs: ["about"] }),
      shopEnabled: true,
      products: [{ slug: "x" }],
    })
    const urls = entries.map((e) => e.url)
    expect(urls).toEqual(["https://shop.test/", "https://shop.test/about"])
  })
})

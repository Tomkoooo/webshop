import { describe, expect, it } from "vitest"
import { defaultModern } from "@wse/template-default-modern/template.config"
import { findPageDefinition } from "@wse/core/templates/resolve-page-definition"
import {
  mergePdpContent,
  parseProductSlugFromPdpPageKey,
  productPdpPageKey,
  templateSupportsPerProductPdpCms,
} from "@wse/core/lib/product-page-content"

describe("product-page-content helpers", () => {
  it("builds and parses scoped PDP page keys", () => {
    expect(productPdpPageKey("noir-01")).toBe("page:pdp:product:noir-01")
    expect(parseProductSlugFromPdpPageKey("page:pdp:product:noir-01")).toBe("noir-01")
    expect(parseProductSlugFromPdpPageKey("page:pdp")).toBeNull()
    expect(parseProductSlugFromPdpPageKey("page:home")).toBeNull()
  })

  it("resolves scoped keys to template pdp definition", () => {
    const def = findPageDefinition(defaultModern, "page:pdp:product:cabin-a")
    expect(def).toBe(defaultModern.pages.pdp)
  })

  it("deep-merges scoped overrides onto template frame", () => {
    const base = {
      ctaLabel: "Add to cart",
      editorial: { title: "Frame title", body: "Frame body" },
      showRelatedProducts: true,
    }
    const scoped = {
      editorial: { title: "Product title" },
      heroEyebrow: "Cabin",
    }
    const merged = mergePdpContent(base, scoped)
    expect(merged.ctaLabel).toBe("Add to cart")
    expect(merged.editorial.title).toBe("Product title")
    expect(merged.editorial.body).toBe("Frame body")
    expect(merged.heroEyebrow).toBe("Cabin")
  })

  it("detects perProductPdpCms capability flag", () => {
    expect(templateSupportsPerProductPdpCms(undefined)).toBe(false)
    expect(templateSupportsPerProductPdpCms({ perProductPdpCms: false })).toBe(false)
    expect(templateSupportsPerProductPdpCms({ perProductPdpCms: true })).toBe(true)
  })
})

describe("pageKey revalidation slug parse", () => {
  it("extracts product slug for scoped revalidation paths", () => {
    expect(parseProductSlugFromPdpPageKey("page:pdp:product:prairie")).toBe("prairie")
  })
})

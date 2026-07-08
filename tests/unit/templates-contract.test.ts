import { describe, expect, it, beforeAll } from "vitest"
import { listAllTemplates, FALLBACK_TEMPLATE_ID } from "@wse/core/templates/registry"
import { listEditablePages } from "@wse/core/templates/cms-pages"
import {
  DEFAULT_TEMPLATE_SURFACES,
  RESERVED_STATIC_PAGE_SLUGS,
  assertValidStaticPageSlug,
  type FlowRouteKey,
} from "@wse/sdk/templates/types"
import type { TemplateModule } from "@wse/sdk/templates/types"

const FLOW_ROUTE_KEYS: FlowRouteKey[] = ["cart", "checkout", "profile"]

let templates: TemplateModule[] = []

beforeAll(async () => {
  templates = await listAllTemplates()
})

describe("Template registry contract", () => {
  it("registers at least one template", () => {
    expect(templates.length).toBeGreaterThan(0)
  })

  it("includes the fallback template id", () => {
    expect(templates.some((t) => t.manifest.id === FALLBACK_TEMPLATE_ID)).toBe(true)
  })

  for (const template of templates) {
    const id = template.manifest.id
    describe(`template '${id}'`, () => {
      it("manifest id matches registry key", () => {
        expect(template.manifest.id).toBe(id)
      })

      it("has a non-empty name and version", () => {
        expect(template.manifest.name.trim()).not.toBe("")
        expect(template.manifest.version).toMatch(/^\d+\.\d+\.\d+/)
      })

      it("declares deployment aligned with commerce restyles", () => {
        const d = template.manifest.deployment
        expect(d === "landing" || d === "commerce").toBe(true)
        if (d === "landing") {
          expect(template.manifest.capabilities.restyles.includes("shop")).toBe(false)
          expect(template.manifest.capabilities.restyles.includes("pdp")).toBe(false)
        }
      })

      it("when commerceSlots.ProductCard is set it is callable", () => {
        const c = template.commerceSlots?.ProductCard
        if (!c) return
        expect(typeof c).toBe("function")
      })

      it("when optional commerceSlots are set they are callable", () => {
        for (const key of ["CategoryPill", "PdpChrome", "NavbarSearch"] as const) {
          const c = template.commerceSlots?.[key]
          if (!c) continue
          expect(typeof c).toBe("function")
        }
      })

      it("declares all three restyled pages", () => {
        expect(template.pages.home).toBeDefined()
        expect(template.pages.shop).toBeDefined()
        expect(template.pages.pdp).toBeDefined()
      })

      it("home defaultContent passes home schema", () => {
        const result = template.pages.home.schema.safeParse(
          template.pages.home.defaultContent
        )
        expect(result.success).toBe(true)
      })

      it("shop defaultContent passes shop schema", () => {
        const result = template.pages.shop.schema.safeParse(
          template.pages.shop.defaultContent
        )
        expect(result.success).toBe(true)
      })

      it("pdp defaultContent passes pdp schema", () => {
        const result = template.pages.pdp.schema.safeParse(
          template.pages.pdp.defaultContent
        )
        expect(result.success).toBe(true)
      })

      it("manifest staticPages and staticPages map agree", () => {
        const declared = new Set(template.manifest.capabilities.staticPages)
        const defined = new Set(Object.keys(template.staticPages))
        for (const slug of declared) {
          expect(defined.has(slug)).toBe(true)
        }
        for (const slug of defined) {
          expect(declared.has(slug)).toBe(true)
        }
      })

      it("declares validated manifest.surfaces", () => {
        expect(template.manifest.surfaces).toEqual(DEFAULT_TEMPLATE_SURFACES)
      })

      it("listEditablePages ordering: home, optional commerce + flow shells, then declared static slugs", () => {
        const staticKeys = template.manifest.capabilities.staticPages.map((s) => `page:${s}`)

        const shopOff = listEditablePages(template, false)
        expect(shopOff.map((p) => p.pageKey)).toEqual(["page:home", ...staticKeys])
        expect(shopOff[0]?.adminSegment).toBe(template.manifest.surfaces.home.adminSegment)

        const shopOn = listEditablePages(template, true)
        const shellFlowKeys = FLOW_ROUTE_KEYS.filter((k) => Boolean(template.flowPages?.[k]?.shell)).map(
          (k) => `page:${k}`
        )

        expect(shopOn.map((p) => p.pageKey)).toEqual([
          "page:home",
          "page:shop",
          "page:pdp",
          ...shellFlowKeys,
          ...staticKeys,
        ])
      })

      it("home uses homepage-blocks CMS", () => {
        expect(template.pages.home.cmsPageKind).toBe("homepage-blocks")
      })

      it("when pages.home.allowedBlocks is set, baseline blocks are a subset", () => {
        const allow = template.pages.home.allowedBlocks
        if (!allow?.length) return
        const types = (template.pages.home.defaultContent as { blocks?: Array<{ type: string }> }).blocks?.map(
          (b) => b.type
        )
        for (const t of types || []) {
          expect(allow.includes(t), `${id}: default block type ${t} must be in allowedBlocks`).toBe(true)
        }
      })

      for (const [slug, def] of Object.entries(template.staticPages)) {
        it(`static page '${slug}' uses a safe slug`, () => {
          expect(() => assertValidStaticPageSlug(slug)).not.toThrow()
          expect(RESERVED_STATIC_PAGE_SLUGS.has(slug)).toBe(false)
        })
        it(`static page '${slug}' defaultContent passes its schema`, () => {
          const result = def.schema.safeParse(def.defaultContent)
          expect(result.success).toBe(true)
        })
      }

      it("provides chrome with Navbar and Footer components", () => {
        expect(typeof template.chrome.Navbar).toBe("function")
        expect(typeof template.chrome.Footer).toBe("function")
      })

      it("when flowPages is provided, keys are cart/checkout/profile with valid compose rules", () => {
        const fp = template.flowPages
        if (!fp) return
        for (const key of FLOW_ROUTE_KEYS) {
          const def = fp[key]
          if (!def) continue
          const routeOnly = def.flowPageCompose === "routeOnly"
          if (routeOnly) {
            expect(typeof def.RouteMain, `${id}: flowPages.${key}.RouteMain (routeOnly)`).toBe("function")
            expect(def.Wrapper, `${id}: routeOnly must omit Wrapper`).toBeUndefined()
            expect(def.shell, `${id}: routeOnly must omit shell`).toBeUndefined()
            expect(def.Body, `${id}: routeOnly must omit Body`).toBeUndefined()
          } else {
            expect(typeof def.Wrapper, `${id}: flowPages.${key}.Wrapper`).toBe("function")
            if (def.Body) {
              expect(typeof def.Body, `${id}: flowPages.${key}.Body`).toBe("function")
            }
            if (def.RouteMain) {
              expect(typeof def.RouteMain, `${id}: flowPages.${key}.RouteMain`).toBe("function")
            }
          }
          if (def.RouteChrome) {
            expect(key, `${id}: RouteChrome only on profile`).toBe("profile")
            expect(typeof def.RouteChrome, `${id}: flowPages.profile.RouteChrome`).toBe("function")
          }
        }
        for (const key of Object.keys(fp)) {
          expect(
            FLOW_ROUTE_KEYS.includes(key as FlowRouteKey),
            `${id}: unexpected flowPages key '${key}'`
          ).toBe(true)
        }
      })

      it("when commerceSlots.ProductDetail is set it is callable", () => {
        const c = template.commerceSlots?.ProductDetail
        if (!c) return
        expect(typeof c).toBe("function")
      })

      it("when flowPages route has shell, defaultContent validates against shell.schema", () => {
        const fp = template.flowPages
        if (!fp) return
        for (const key of FLOW_ROUTE_KEYS) {
          const def = fp[key]
          if (!def?.shell) continue
          const parsed = def.shell.schema.safeParse(def.shell.defaultContent)
          expect(parsed.success, `${id}: flowPages.${key}.shell defaultContent`).toBe(true)
        }
      })

      it("when defaultTheme is provided, it ships the required token strings", () => {
        if (!template.defaultTheme) return
        const required = [
          "primary",
          "primaryForeground",
          "secondary",
          "background",
          "foreground",
          "border",
          "muted",
        ] as const
        for (const key of required) {
          expect(typeof template.defaultTheme[key]).toBe("string")
        }
      })
    })
  }
})

describe("Static page slug validator", () => {
  it("accepts simple slugs", () => {
    expect(() => assertValidStaticPageSlug("about")).not.toThrow()
    expect(() => assertValidStaticPageSlug("our-story")).not.toThrow()
    expect(() => assertValidStaticPageSlug("legal/terms")).not.toThrow()
  })

  it("rejects reserved slugs", () => {
    for (const slug of RESERVED_STATIC_PAGE_SLUGS) {
      expect(() => assertValidStaticPageSlug(slug)).toThrow()
    }
  })

  it("rejects slugs starting with /", () => {
    expect(() => assertValidStaticPageSlug("/about")).toThrow()
  })

  it("rejects slugs containing ..", () => {
    expect(() => assertValidStaticPageSlug("../etc/passwd")).toThrow()
  })

  it("rejects uppercase characters", () => {
    expect(() => assertValidStaticPageSlug("About")).toThrow()
  })

  it("rejects empty string", () => {
    expect(() => assertValidStaticPageSlug("")).toThrow()
  })
})

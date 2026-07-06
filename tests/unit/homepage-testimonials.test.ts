import { describe, expect, it } from "vitest"
import { linkifyPlainText } from "@/lib/linkify-plain-text"
import { TestimonialSourceLink } from "@/lib/testimonial-source-link"
import { nagyarcuPressQuotes } from "../../scripts/seed/lib/nagyarcu-press-quotes"
import {
  insertionIndexForHomepageBlockType,
  resolveAllowedHomepageBlockTypes,
} from "@/features/homepage-cms/utils/homepage-block-allowlist"
import { defaultModern } from "@/templates/default-modern/template.config"

describe("linkifyPlainText", () => {
  it("wraps https URLs in external links", () => {
    const nodes = linkifyPlainText("See https://example.com/page for details")
    expect(nodes).toHaveLength(3)
    expect(nodes[1]).toMatchObject({
      type: "a",
      props: {
        href: "https://example.com/page",
        target: "_blank",
        rel: "noopener noreferrer",
      },
    })
  })

  it("normalizes www URLs", () => {
    const nodes = linkifyPlainText("Visit www.example.com today")
    expect(nodes[1]).toMatchObject({
      type: "a",
      props: {
        href: "https://www.example.com",
      },
    })
  })

  it("returns plain text when no URLs are present", () => {
    expect(linkifyPlainText("No links here")).toEqual(["No links here"])
  })
})

describe("default-modern homepage testimonials", () => {
  it("allows testimonials after about in section order", () => {
    const allowed = resolveAllowedHomepageBlockTypes(defaultModern.pages.home)
    expect(allowed).toEqual([
      "hero",
      "about",
      "testimonials",
      "gallery",
      "features",
      "productGrid",
      "contact",
    ])
  })

  it("inserts testimonials directly after about", () => {
    const blocks = [
      { id: "hero-1", type: "hero" as const, enabled: true, data: {} },
      { id: "about-1", type: "about" as const, enabled: true, data: {} },
      { id: "gallery-1", type: "gallery" as const, enabled: true, data: {} },
    ]
    const allowed = resolveAllowedHomepageBlockTypes(defaultModern.pages.home)
    const idx = insertionIndexForHomepageBlockType(blocks, "testimonials", allowed)
    expect(idx).toBe(2)
    expect(blocks[idx - 1]?.type).toBe("about")
  })
})

describe("nagyarcu press quote seed", () => {
  it("stores quotes as content with outlet names and article URLs", () => {
    expect(nagyarcuPressQuotes).toHaveLength(7)
    expect(nagyarcuPressQuotes[0]).toMatchObject({
      name: "IGN.hu",
      sourceUrl: "https://hu.ign.com/en-a-nagyarcu",
    })
    expect(nagyarcuPressQuotes[0]?.quote).toContain("ellenpropaganda-anyag")
    expect(nagyarcuPressQuotes[0]?.quote).not.toMatch(/^https?:\/\//)
  })
})

describe("TestimonialSourceLink", () => {
  it("renders an external link when sourceUrl is set", () => {
    const node = TestimonialSourceLink({
      name: "IGN.hu",
      sourceUrl: "https://hu.ign.com/en-a-nagyarcu",
    })
    expect(node).toMatchObject({
      type: "a",
      props: {
        href: "https://hu.ign.com/en-a-nagyarcu",
        target: "_blank",
        rel: "noopener noreferrer",
        children: "IGN.hu",
      },
    })
  })

  it("renders plain text when sourceUrl is missing", () => {
    const node = TestimonialSourceLink({ name: "IGN.hu" })
    expect(node).toMatchObject({
      props: {
        children: "IGN.hu",
      },
    })
  })
})

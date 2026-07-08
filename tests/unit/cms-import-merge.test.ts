import { describe, expect, it } from "vitest"
import { applyHomepageBlockPatches } from "../../scripts/cms/lib/apply-homepage-patches"
import { deepMerge } from "../../scripts/cms/lib/deep-merge"
import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"

const baseSnapshot: HomepageSnapshot = {
  meta: { seoTitle: "Old", seoDescription: "Old desc" },
  blocks: [
    {
      id: "hero-1",
      type: "hero",
      enabled: true,
      data: {
        title: "Before",
        description: "Desc",
        primaryCtaLabel: "Shop",
        primaryCtaHref: "/shop",
        secondaryCtaLabel: "About",
        secondaryCtaHref: "#about",
        heroImage: "/x.svg",
        badges: ["a"],
      },
    },
    {
      id: "about-1",
      type: "about",
      enabled: true,
      data: {
        title: "About",
        paragraph: "Story",
        accordions: [{ title: "Q", content: "A" }],
        cards: [],
      },
    },
  ],
}

describe("cms import merge helpers", () => {
  it("deepMerge keeps nested keys and replaces arrays", () => {
    const merged = deepMerge(
      { a: 1, nested: { x: 1, y: [1, 2] } },
      { nested: { y: [9], z: 3 } }
    )
    expect(merged).toEqual({ a: 1, nested: { x: 1, y: [9], z: 3 } })
  })

  it("applyHomepageBlockPatches updates by type", () => {
    const next = applyHomepageBlockPatches(baseSnapshot, [
      {
        matchBy: "type",
        target: "hero",
        data: { title: "After" },
      },
    ])
    expect(next.blocks[0].data.title).toBe("After")
    expect(next.blocks[0].data.description).toBe("Desc")
  })

  it("applyHomepageBlockPatches updates by id", () => {
    const next = applyHomepageBlockPatches(baseSnapshot, [
      {
        matchBy: "id",
        target: "about-1",
        data: { paragraph: "New story" },
        enabled: false,
      },
    ])
    expect(next.blocks[1].enabled).toBe(false)
    expect(next.blocks[1].data.paragraph).toBe("New story")
  })
})

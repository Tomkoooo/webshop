import { describe, expect, it } from "vitest"
import {
  extractVideoEmbedCandidates,
  mergeVideoEmbedItems,
  parseVideoEmbedBulk,
  parseVideoEmbedUrl,
} from "@/lib/video-embed"
import {
  NAGYARCU_DEFAULT_VIDEO_URLS,
  createNagyarcuVideoCarouselBlock,
  withNagyarcuVideoCarouselFallback,
} from "@/lib/nagyarcu-video-defaults"
import type { HomepageSnapshot } from "@/features/homepage-cms/types/block-types"

const tiktokEmbedHtml = `<blockquote class="tiktok-embed" cite=https://www.tiktok.com/@enanagyarcu/video/7663085712421555478 data-video-id="7663085712421555478" style="max-width: 605px;min-width: 325px;" > <section> <a target="_blank" title="@enanagyarcu" href=https://www.tiktok.com/@enanagyarcu?refer=embed>@enanagyarcu</a> </section> </blockquote> <script async src=https://www.tiktok.com/embed.js></script>`

describe("parseVideoEmbedUrl", () => {
  it("parses YouTube watch URLs", () => {
    expect(parseVideoEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toMatchObject({
      provider: "youtube",
      embedUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    })
  })

  it("parses youtu.be and shorts URLs", () => {
    expect(parseVideoEmbedUrl("https://youtu.be/dQw4w9WgXcQ").embedUrl).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    )
    expect(parseVideoEmbedUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ").embedUrl).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
    )
  })

  it("parses TikTok video URLs", () => {
    expect(
      parseVideoEmbedUrl("https://www.tiktok.com/@creator/video/7123456789012345678")
    ).toMatchObject({
      provider: "tiktok",
      embedUrl: "https://www.tiktok.com/embed/v2/7123456789012345678",
    })
  })

  it("parses TikTok embed HTML with unquoted cite attributes", () => {
    const parsed = parseVideoEmbedUrl(tiktokEmbedHtml)
    expect(parsed).toMatchObject({
      provider: "tiktok",
      embedUrl: "https://www.tiktok.com/embed/v2/7663085712421555478",
      sourceUrl: "https://www.tiktok.com/@enanagyarcu/video/7663085712421555478",
    })
  })

  it("rejects unknown URLs", () => {
    expect(parseVideoEmbedUrl("https://example.com/video/1")).toMatchObject({
      provider: "unknown",
      embedUrl: null,
    })
  })
})

describe("parseVideoEmbedBulk", () => {
  it("extracts multiple TikTok embeds from pasted HTML", () => {
    const html = `
      ${tiktokEmbedHtml}
      <blockquote class="tiktok-embed" cite=https://www.tiktok.com/@enanagyarcu/video/7665276902130584834 data-video-id="7665276902130584834"></blockquote>
    `
    const items = parseVideoEmbedBulk(html)
    expect(items).toHaveLength(2)
    expect(items.map((item) => parseVideoEmbedUrl(item.url).embedUrl)).toEqual([
      "https://www.tiktok.com/embed/v2/7663085712421555478",
      "https://www.tiktok.com/embed/v2/7665276902130584834",
    ])
  })

  it("merges without duplicates", () => {
    const existing = [{ url: "https://www.tiktok.com/@enanagyarcu/video/7663085712421555478" }]
    const next = mergeVideoEmbedItems(existing, parseVideoEmbedBulk(tiktokEmbedHtml))
    expect(next).toHaveLength(1)
  })

  it("finds candidates from bare data-video-id", () => {
    expect(extractVideoEmbedCandidates('data-video-id="7663085712421555478"')).toContain(
      "https://www.tiktok.com/video/7663085712421555478"
    )
  })
})

describe("nagyarcu video defaults", () => {
  it("ships five default TikTok URLs", () => {
    expect(NAGYARCU_DEFAULT_VIDEO_URLS).toHaveLength(5)
    for (const url of NAGYARCU_DEFAULT_VIDEO_URLS) {
      expect(parseVideoEmbedUrl(url).provider).toBe("tiktok")
    }
  })

  it("injects fallback only when videoCarousel block is missing", () => {
    const base: HomepageSnapshot = {
      blocks: [
        {
          id: "about-1",
          type: "about",
          enabled: true,
          data: { title: "A", paragraph: "B", accordions: [], cards: [] },
        },
      ],
      meta: { seoTitle: "", seoDescription: "" },
    }
    const withFallback = withNagyarcuVideoCarouselFallback(base, "nagyarcu-shop")
    expect(withFallback.blocks.some((b) => b.type === "videoCarousel")).toBe(true)
    expect(
      withFallback.blocks.find((b) => b.type === "videoCarousel")?.data.items
    ).toHaveLength(5)
  })

  it("replaces unparseable-only video items with defaults", () => {
    const broken: HomepageSnapshot = {
      blocks: [
        {
          id: "video-1",
          type: "videoCarousel",
          enabled: true,
          data: { title: "Videók", items: [{ url: "not-a-video" }] },
        },
      ],
      meta: { seoTitle: "", seoDescription: "" },
    }
    const fixed = withNagyarcuVideoCarouselFallback(broken, "nagyarcu-shop")
    expect(fixed.blocks[0]?.type).toBe("videoCarousel")
    expect(fixed.blocks[0]?.data.items).toHaveLength(5)
  })

  it("keeps intentionally empty carousel lists", () => {
    const withEmpty: HomepageSnapshot = {
      blocks: [
        {
          id: "video-1",
          type: "videoCarousel",
          enabled: true,
          data: { title: "Videók", items: [] },
        },
      ],
      meta: { seoTitle: "", seoDescription: "" },
    }
    expect(withNagyarcuVideoCarouselFallback(withEmpty, "nagyarcu-shop").blocks[0]).toEqual(
      withEmpty.blocks[0]
    )
  })

  it("does not inject for other deployments", () => {
    const base: HomepageSnapshot = {
      blocks: [],
      meta: { seoTitle: "", seoDescription: "" },
    }
    expect(withNagyarcuVideoCarouselFallback(base, "default").blocks).toHaveLength(0)
  })
})

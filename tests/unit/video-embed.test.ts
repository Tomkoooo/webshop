import { describe, expect, it } from "vitest"
import { parseVideoEmbedUrl } from "@/lib/video-embed"

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

  it("rejects unknown URLs", () => {
    expect(parseVideoEmbedUrl("https://example.com/video/1")).toMatchObject({
      provider: "unknown",
      embedUrl: null,
    })
  })
})

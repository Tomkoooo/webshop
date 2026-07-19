import { describe, expect, it } from "vitest"
import {
  absolutizeTBookMediaUrl,
  mediaOriginFromApiBase,
  rewriteTBookPublicMediaPayload,
} from "@wse/plugin-t-book/lib/public-media-url"

describe("public-media-url", () => {
  it("derives media origin from upstream API base", () => {
    expect(mediaOriginFromApiBase("https://tbook.example.com/api/plugins/t-book")).toBe(
      "https://tbook.example.com"
    )
  })

  it("absolutizes bare filenames against media origin", () => {
    expect(absolutizeTBookMediaUrl("abc.jpg", "https://tbook.example.com")).toBe(
      "https://tbook.example.com/api/media/abc.jpg"
    )
  })

  it("rewrites event hero and hotel galleries in public payloads", () => {
    const rewritten = rewriteTBookPublicMediaPayload(
      {
        events: [{ id: "1", heroImage: "hero.jpg" }],
        hotels: [{ id: "h1", gallery: ["a.jpg", "b.jpg"] }],
      },
      "https://tbook.example.com"
    ) as {
      events: Array<{ heroImage: string }>
      hotels: Array<{ gallery: string[] }>
    }

    expect(rewritten.events[0].heroImage).toBe("https://tbook.example.com/api/media/hero.jpg")
    expect(rewritten.hotels[0].gallery).toEqual([
      "https://tbook.example.com/api/media/a.jpg",
      "https://tbook.example.com/api/media/b.jpg",
    ])
  })
})

import { describe, expect, it } from "vitest"
import { homeDefaultContent } from "../../packages/templates/world-darts-festival/pages/home/defaultContent"
import { normalizeWdfHomeContent } from "../../packages/templates/world-darts-festival/lib/normalize-wdf-home-content"

describe("normalizeWdfHomeContent", () => {
  it("merges partial stored content with defaults", () => {
    const result = normalizeWdfHomeContent(
      {
        hero: {
          title: "Custom title",
        },
      },
      homeDefaultContent
    )
    expect(result.hero.title).toBe("Custom title")
    expect(result.hero.tagline).toBe(homeDefaultContent.hero.tagline)
    expect(result.prizeMoney.tables.length).toBeGreaterThan(0)
  })

  it("migrates legacy flat heroImage to hero.heroImage", () => {
    const result = normalizeWdfHomeContent(
      { heroImage: "/uploads/legacy-hero.jpg" },
      homeDefaultContent
    )
    expect(result.hero.heroImage).toBe("/uploads/legacy-hero.jpg")
  })

  it("backfills prizeMoney section for older snapshots", () => {
    const result = normalizeWdfHomeContent(
      {
        hero: homeDefaultContent.hero,
        chrome: homeDefaultContent.chrome,
      },
      homeDefaultContent
    )
    expect(result.prizeMoney.heading).toBe(homeDefaultContent.prizeMoney.heading)
    expect(result.prizeMoney.tables).toEqual(homeDefaultContent.prizeMoney.tables)
  })
})

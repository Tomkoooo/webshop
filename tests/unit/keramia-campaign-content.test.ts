import { describe, expect, it } from "vitest"
import { fogfeheritesDefault } from "@wse/template-keramia-shared/static-pages/shared/defaults/fogfeherites"
import { normalizeCampaignContent } from "@wse/template-keramia-shared/lib/normalize-campaign-content"

describe("normalizeCampaignContent", () => {
  it("fills missing sections from defaults when stored JSON is partial", () => {
    const partial = { hero: { title: "Csak cím" } }
    const out = normalizeCampaignContent(partial, fogfeheritesDefault)
    expect(out.hero.title).toBe("Csak cím")
    expect(out.benefits.length).toBeGreaterThan(0)
    expect(out.contact.interestOptions.length).toBeGreaterThan(0)
    expect(out.offer.bullets.length).toBeGreaterThan(0)
  })

  it("replaces legacy homepage block payloads with a full campaign snapshot", () => {
    const legacy = {
      version: "1",
      blocks: [{ id: "hero-1", type: "hero", enabled: true, data: { title: "Legacy" } }],
    }
    const out = normalizeCampaignContent(legacy, fogfeheritesDefault)
    expect(out.hero.title).toBeTruthy()
    expect(out.benefits).toBeDefined()
    expect(Array.isArray(out.faq.items)).toBe(true)
  })
})

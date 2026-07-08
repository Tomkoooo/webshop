import { journalSchema, type JournalContent } from "./schema"

export const journalDefaultContent: JournalContent = journalSchema.parse({
  intro: {
    title: "Field notes",
    lede: "Short dispatches from the studio — open a card to read the full piece. Managed as structured entries in the CMS.",
  },
  posts: [
    {
      title: "Dye lot 14-B",
      topic: "Process",
      excerpt: "Why we stopped matching screens to cloth.",
      bodyHtml:
        "<p>Monitors lie. We publish our dye lots with a physical swatch code so you can hold the truth in your hands.</p><h3>What changed</h3><p>We moved approvals to daylight-only review. If it fails at 9am beside the window, it does not ship.</p><p><img src=\"/placeholder.png\" alt=\"Swatch\" /></p>",
      coverImage: "/placeholder.png",
    },
    {
      title: "Shipping glass in winter",
      topic: "Logistics",
      excerpt: "Double-boxing without plastic guilt.",
      bodyHtml:
        "<p>We use molded pulp and paper tape. The outer carton carries a wax seal so you know it has not been opened in transit.</p>",
      coverImage: "/placeholder.png",
    },
    {
      title: "Profile: the pattern cutter",
      topic: "People",
      excerpt: "Twelve years of shears and chalk.",
      bodyHtml: "<p>Every curve is walked twice — once fast for spirit, once slow for tolerance.</p>",
      coverImage: "/placeholder.png",
    },
  ],
  meta: {
    seoTitle: "Journal · Atelier Showcase",
    seoDescription: "Read-only journal cards with modal articles, edited in the visual CMS.",
  },
})

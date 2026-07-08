import { homeSchema } from "./schema"
import type { HomeContent } from "./schema"

export const homeDefaultContent: HomeContent = homeSchema.parse({
  meta: {
    seoTitle: "Atelier Showcase · Curated commerce",
    seoDescription: "Curated homeware and small-batch objects — shop, stories, and studio journal.",
  },
  blocks: [
    {
      id: "hero-atelier",
      type: "hero",
      enabled: true,
      data: {
        title: "Objects for slow afternoons",
        description:
          "Homeware and tools chosen for daily use — warm materials, quiet details, and pieces that age with you.",
        primaryCtaLabel: "Browse shop",
        primaryCtaHref: "/shop",
        secondaryCtaLabel: "Read journal",
        secondaryCtaHref: "/journal",
        heroImage: "/placeholder.png",
        heroImages: ["/placeholder.png"],
        imageDurationSeconds: 5,
        heroDurationSeconds: 8,
        badges: ["Hand finished", "Small batches", "Ships from EU"],
      },
    },
    {
      id: "div-1",
      type: "divider",
      enabled: true,
      data: { label: "Inside the atelier" },
    },
    {
      id: "richtext-1",
      type: "richText",
      enabled: true,
      data: {
        title: "Letter from the bench",
        html: "<p>We work in small runs — when a batch is gone, the next may differ slightly in tone or finish.</p><p>Write if you need dimensions, care notes, or a shipping date; we answer from the bench, not a script.</p>",
      },
    },
    {
      id: "gallery-1",
      type: "gallery",
      enabled: true,
      data: {
        title: "Surface & pigment",
        items: [
          { image: "/placeholder.png", caption: "Warm ground" },
          { image: "/placeholder.png", caption: "Cool shadow" },
          { image: "/placeholder.png", caption: "Accent stroke" },
        ],
      },
    },
    {
      id: "about-1",
      type: "about",
      enabled: true,
      data: {
        title: "Our rhythm",
        paragraph:
          "Morning is for cutting; afternoon is for correspondence. The storefront you see here mirrors that cadence — calm chrome, loud only where the product demands it.",
        accordions: [
          { title: "Materials", content: "Natural fibers and oiled metals — nothing that cannot age gracefully." },
          { title: "Fulfillment", content: "Orders leave mid-week so weekend arrivals feel intentional." },
        ],
        cards: [
          { title: "Made to order", description: "Some pieces ship within days; others are cast or turned to your lead time.", icon: "Sparkles" },
          { title: "Studio notes", description: "Longer reads and process shots live under Journal; stock updates land in the shop.", icon: "Layout" },
        ],
      },
    },
    {
      id: "features-1",
      type: "features",
      enabled: true,
      data: {
        title: "Why shop here",
        subtitle: "Straightforward pricing, careful packing, and humans on the other end of email.",
        cards: [
          { title: "Materials first", description: "Oiled wood, linen, brass — we list what touches food, skin, or water." },
          { title: "Clear filters", description: "Category, search, and sort stay in the URL so you can share a view." },
          { title: "One voice end-to-end", description: "Cart, checkout, and account use the same typography and tone as the shop." },
        ],
      },
    },
    {
      id: "products-1",
      type: "productGrid",
      enabled: true,
      data: {
        title: "Featured pieces",
        description: "Pick featured pieces in the editor — leave empty to show the newest arrivals.",
        viewAllLabel: "Open catalog",
        viewAllHref: "/shop",
        categoriesTitle: "Browse by room",
        categoriesDescription: "Categories follow your live taxonomy.",
        layout: "carousel",
        maxItems: 8,
        selectedProductIds: [],
      },
    },
    {
      id: "testimonials-1",
      type: "testimonials",
      enabled: true,
      data: {
        title: "Voices",
        subtitle: "Short notes from people who live with the work.",
        items: [
          {
            quote: "Packaging was minimal but secure — the brass has already started to patina where I grip it.",
            name: "Mara V.",
            role: "Budapest",
            rating: 5,
          },
          {
            quote: "They confirmed lead time before charging; the piece arrived exactly when promised.",
            name: "Jon K.",
            role: "Vienna",
            rating: 5,
          },
        ],
      },
    },
    {
      id: "cta-1",
      type: "cta",
      enabled: true,
      data: {
        title: "Visit the journal or write us",
        description: "Read longer studio notes on the journal page, or send dimensions and timing questions.",
        primaryLabel: "Editorial",
        primaryHref: "/editorial",
        secondaryLabel: "Journal",
        secondaryHref: "/journal",
        variant: "solid",
      },
    },
    {
      id: "contact-1",
      type: "contact",
      enabled: true,
      data: {
        title: "Visit or write",
        description: "We reply within two working days — include a phone number if you prefer a call back.",
        companyName: "Atelier",
        address: "Studio address",
        phone: "+36 1 000 0000",
        email: "hello@example.com",
        sendButtonLabel: "Send",
        nameLabel: "Name",
        emailLabel: "Email",
        messageLabel: "Message",
      },
    },
  ],
})

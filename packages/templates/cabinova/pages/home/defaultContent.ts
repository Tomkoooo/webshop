import { homeSchema } from "./schema"
import type { HomeContent } from "./schema"

export const homeDefaultContent: HomeContent = homeSchema.parse({
  meta: {
    seoTitle: "Cabinova — Modular houses, quietly made",
    seoDescription:
      "Architect-designed modular houses, cabins, and studios. Six modules, forty-eight configurations, eleven weeks to delivery.",
  },
  blocks: [
    {
      id: "hero-cabinova",
      type: "hero",
      enabled: true,
      data: {
        title: "A house, delivered in eleven weeks.",
        description:
          "Six modules. Forty-eight configurations. One way of building — architect-led, factory-precise, set on your land in a single morning.",
        primaryCtaLabel: "View the catalog",
        primaryCtaHref: "/shop",
        secondaryCtaLabel: "Contact",
        secondaryCtaHref: "/contact",
        heroImage: "/template-assets/cabinova/hero-forest.jpg",
        heroImages: ["/template-assets/cabinova/hero-forest.jpg"],
        imageDurationSeconds: 5,
        heroDurationSeconds: 8,
        badges: ["Est. Brussels — Catalog N° 07"],
      },
    },
    {
      id: "about-cabinova",
      type: "about",
      enabled: true,
      data: {
        title:
          "We build the way watchmakers build — in calibrated parts, under controlled light, with the same hand returning to the same joint a thousand times.",
        paragraph: "",
        accordions: [],
        cards: [
          { title: "11", description: "Weeks from order to keys", icon: "Sparkles" },
          { title: "06", description: "Base modules in the catalog", icon: "Layout" },
          { title: "48", description: "Validated configurations", icon: "Shield" },
        ],
      },
    },
    {
      id: "products-cabinova",
      type: "productGrid",
      enabled: true,
      data: {
        title: "Four shapes of the same idea.",
        description: "Explore the catalog of cabins, houses, and studios.",
        viewAllLabel: "All collections",
        viewAllHref: "/shop",
        categoriesTitle: "Browse by type",
        categoriesDescription: "Cabins, houses, studios, and ateliers.",
        layout: "carousel",
        maxItems: 4,
        selectedProductIds: [],
      },
    },
    {
      id: "features-cabinova",
      type: "features",
      enabled: true,
      data: {
        title: "Three steps, eleven weeks, one set of keys.",
        subtitle: "",
        cards: [
          {
            title: "Site & sketch",
            description:
              "We visit the land, listen to the brief, and draft a configuration in two weeks.",
          },
          {
            title: "Factory build",
            description: "Modules are built indoors in a controlled facility, on a six-week cycle.",
          },
          {
            title: "Crane & key",
            description:
              "Delivered on flatbed, lifted onto prepared piers, and habitable the same week.",
          },
        ],
      },
    },
    {
      id: "contact-cabinova",
      type: "contact",
      enabled: true,
      data: {
        title: "A few lines is enough to begin.",
        description:
          "Tell us where the project lives and what you're imagining. We reply within 48 hours, by hand.",
        companyName: "Cabinova Studio",
        address: "Brussels, BE",
        phone: "",
        email: "",
        nameLabel: "Name",
        emailLabel: "Email",
        messageLabel: "Message",
        sendButtonLabel: "Send",
      },
    },
  ],
})

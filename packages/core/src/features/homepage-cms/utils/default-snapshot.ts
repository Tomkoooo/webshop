import type { HomepageSnapshot } from "@wse/core/features/homepage-cms/types/block-types"

export function getDefaultHomepageSnapshot(): HomepageSnapshot {
  return {
    blocks: [
      {
        id: "hero-1",
        type: "hero",
        enabled: true,
        data: {
          title: "Build Better Online",
          description: "A modern, conversion-focused homepage you can edit visually.",
          primaryCtaLabel: "Shop now",
          primaryCtaHref: "/shop",
          secondaryCtaLabel: "Learn more",
          secondaryCtaHref: "#about",
          heroImage: "/generic-hero.svg",
          heroImages: ["/generic-hero.svg"],
          imageDurationSeconds: 4,
          heroDurationSeconds: 6,
          heroSlides: [
            {
              title: "Build Better Online",
              description: "A modern, conversion-focused homepage you can edit visually.",
              primaryCtaLabel: "Shop now",
              primaryCtaHref: "/shop",
              secondaryCtaLabel: "Learn more",
              secondaryCtaHref: "#about",
              badges: ["Fast shipping", "Premium quality", "Trusted support"],
              images: ["/generic-hero.svg"],
              imageDurationSeconds: 4,
              durationSeconds: 6,
            },
          ],
          badges: ["Fast shipping", "Premium quality", "Trusted support"],
        },
      },
      {
        id: "about-1",
        type: "about",
        enabled: true,
        data: {
          title: "About our company",
          paragraph: "Share your story, values, and what makes you different.",
          accordions: [
            { title: "Our mission", content: "Deliver quality products with reliable support." },
            { title: "Our process", content: "Careful selection and fast fulfillment." },
          ],
          cards: [
            { title: "Quality", description: "Trusted products.", icon: "Shield" },
            { title: "Team", description: "Helpful experts.", icon: "Users" },
          ],
        },
      },
      {
        id: "gallery-1",
        type: "gallery",
        enabled: true,
        data: {
          title: "Gallery",
          items: [],
        },
      },
      {
        id: "features-1",
        type: "features",
        enabled: true,
        data: {
          title: "Why customers choose us",
          subtitle: "Everything you need for a premium shopping experience.",
          cards: [
            { title: "Reliable quality", description: "Products carefully selected for durability." },
            { title: "Fast support", description: "Get answers quickly from our team.", icon: "Clock3" },
            { title: "Easy returns", description: "Straightforward process when plans change.", icon: "RotateCcw" },
          ],
        },
      },
      {
        id: "products-1",
        type: "productGrid",
        enabled: true,
        data: {
          title: "Featured products",
          description: "Hand-picked products for this week.",
          viewAllLabel: "View all products",
          viewAllHref: "/shop",
          categoriesTitle: "Featured categories",
          categoriesDescription: "Main categories your customers browse first.",
          layout: "grid",
          maxItems: 8,
          selectedProductIds: [],
        },
      },
      {
        id: "contact-1",
        type: "contact",
        enabled: true,
        data: {
          title: "Contact us",
          description: "Reach out to our team for support and questions.",
          companyName: "Your company",
          address: "Company address",
          phone: "+36...",
          email: "hello@example.com",
          sendButtonLabel: "Send message",
          nameLabel: "Full Name",
          emailLabel: "Email Address",
          messageLabel: "Message",
        },
      },
    ],
    meta: {
      seoTitle: "Modern Webshop",
      seoDescription: "A modern webshop experience with visual CMS editing.",
    },
  }
}

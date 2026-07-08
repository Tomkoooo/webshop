import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const heroDefinition: BlockDefinition<"hero"> = {
  type: "hero",
  label: "Fő hős szekció",
  create: () => ({
    id: `hero-${Date.now()}`,
    type: "hero",
    enabled: true,
    data: {
      title: "Új hero cím",
      description: "Hero leírás",
      primaryCtaLabel: "Elsődleges művelet",
      primaryCtaHref: "/shop",
      secondaryCtaLabel: "Másodlagos művelet",
      secondaryCtaHref: "#about",
      heroImage: "/generic-hero.svg",
      heroImages: ["/generic-hero.svg"],
      imageDurationSeconds: 4,
      heroDurationSeconds: 6,
      heroSlides: [
        {
          title: "Új hero cím",
          description: "Hero leírás",
          primaryCtaLabel: "Elsődleges művelet",
          primaryCtaHref: "/shop",
          secondaryCtaLabel: "Másodlagos művelet",
          secondaryCtaHref: "#about",
          badges: ["Első jelvény", "Második jelvény"],
          images: ["/generic-hero.svg"],
          imageDurationSeconds: 4,
          durationSeconds: 6,
        },
      ],
      badges: ["Első jelvény", "Második jelvény"],
    },
  }),
}

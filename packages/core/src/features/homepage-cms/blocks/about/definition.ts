import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const aboutDefinition: BlockDefinition<"about"> = {
  type: "about",
  label: "Rólunk",
  create: () => ({
    id: `about-${Date.now()}`,
    type: "about",
    enabled: true,
    data: {
      title: "Rólunk",
      paragraph: "Meséld el itt a történetedet.",
      accordions: [
        { title: "Küldetésünk", content: "Mi hajtja a cégedet." },
        { title: "Értékeink", content: "Mit képvisel a csapatod." },
      ],
      cards: [
        { title: "Minőség", description: "Tartósra tervezve.", icon: "Shield" },
        { title: "Szerviz", description: "Gyorsan segítünk.", icon: "Headphones" },
      ],
    },
  }),
}

import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const ctaDefinition: BlockDefinition<"cta"> = {
  type: "cta",
  label: "Felhívás",
  create: () => ({
    id: `cta-${Date.now()}`,
    type: "cta",
    enabled: true,
    data: {
      title: "Készen állsz az indulásra?",
      description: "Tereld a felhasználókat az elsődleges műveletre.",
      primaryLabel: "Elsődleges művelet",
      primaryHref: "/shop",
      secondaryLabel: "Másodlagos művelet",
      secondaryHref: "/contact",
      variant: "solid",
    },
  }),
}

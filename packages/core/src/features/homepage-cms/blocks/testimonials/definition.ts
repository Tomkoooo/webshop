import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const testimonialsDefinition: BlockDefinition<"testimonials"> = {
  type: "testimonials",
  label: "Vélemények",
  create: () => ({
    id: `testimonials-${Date.now()}`,
    type: "testimonials",
    enabled: true,
    data: {
      title: "Vásárlói vélemények",
      subtitle: "Mit mondanak a vásárlóink",
      items: [{ quote: "Nagyon jó élmény volt.", name: "János", role: "Vásárló", rating: 5 }],
    },
  }),
}

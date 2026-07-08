import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const featuresDefinition: BlockDefinition<"features"> = {
  type: "features",
  label: "Előnyök",
  create: () => ({
    id: `features-${Date.now()}`,
    type: "features",
    enabled: true,
    data: {
      title: "Előnyök szekció",
      subtitle: "Mutasd be az értékajánlatodat.",
      cards: [
        { title: "Gyors", description: "Gyors működés.", icon: "Zap" },
        { title: "Megbízható", description: "Megbízható minőség.", icon: "ShieldCheck" },
      ],
    },
  }),
}

import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const galleryDefinition: BlockDefinition<"gallery"> = {
  type: "gallery",
  label: "Galéria",
  create: () => ({
    id: `gallery-${Date.now()}`,
    type: "gallery",
    enabled: true,
    data: {
      title: "Galéria",
      items: [],
    },
  }),
}

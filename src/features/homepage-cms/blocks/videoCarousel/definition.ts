import type { BlockDefinition } from "@/features/homepage-cms/blocks/types"

export const videoCarouselDefinition: BlockDefinition<"videoCarousel"> = {
  type: "videoCarousel",
  label: "Videó karusszel",
  create: () => ({
    id: `video-carousel-${Date.now()}`,
    type: "videoCarousel",
    enabled: true,
    data: {
      title: "Videók",
      items: [],
    },
  }),
}

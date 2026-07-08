import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const dividerDefinition: BlockDefinition<"divider"> = {
  type: "divider",
  label: "Elválasztó",
  create: () => ({
    id: `divider-${Date.now()}`,
    type: "divider",
    enabled: true,
    data: { label: "" },
  }),
}

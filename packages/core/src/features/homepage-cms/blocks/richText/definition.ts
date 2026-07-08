import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const richTextDefinition: BlockDefinition<"richText"> = {
  type: "richText",
  label: "Formázott szöveg",
  create: () => ({
    id: `richtext-${Date.now()}`,
    type: "richText",
    enabled: true,
    data: {
      title: "Formázott szöveg szekció",
      html: "<p>Itt írd meg a tartalmat.</p>",
    },
  }),
}

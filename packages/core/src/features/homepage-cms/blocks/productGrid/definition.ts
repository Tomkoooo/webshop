import type { BlockDefinition } from "@wse/core/features/homepage-cms/blocks/types"

export const productGridDefinition: BlockDefinition<"productGrid"> = {
  type: "productGrid",
  label: "Termék rács",
  create: () => ({
    id: `products-${Date.now()}`,
    type: "productGrid",
    enabled: true,
    data: {
      title: "Kiemelt termékek",
      description: "Válaszd ki a kiemelendő termékeket.",
      viewAllLabel: "Összes termék",
      viewAllHref: "/shop",
      categoriesTitle: "Kiemelt kategóriák",
      categoriesDescription: "Emeld ki a legfontosabb kategóriákat.",
      layout: "grid",
      maxItems: 8,
      selectedProductIds: [],
    },
  }),
}

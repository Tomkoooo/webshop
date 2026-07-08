import { z } from "zod"

export const shopSchema = z.object({
  eyebrow: z.string().default("Catalog — N° 07 / 2026"),
  heading: z.string().default("The complete catalog."),
  subheading: z
    .string()
    .default(
      "Four families. Twelve standard configurations. Each model can be ordered as a base plan or extended through our atelier service."
    ),
  filtersPosition: z.enum(["sidebar", "top"]).default("sidebar"),
  productGridColumns: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(3),
  pageSize: z.number().int().min(4).max(48).default(12),
  emptyStateMessage: z.string().default("No models match this search."),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type ShopContent = z.infer<typeof shopSchema>

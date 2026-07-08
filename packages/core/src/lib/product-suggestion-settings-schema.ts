import { z } from "zod"

/** One rule in the merge pipeline (ordered). */
export const suggestionSourceSchema = z.union([
  z.object({
    type: z.literal("random_catalog"),
    take: z.number().int().min(1).max(50).optional(),
  }),
  z.object({
    type: z.literal("random_price_range"),
    minNet: z.number().nonnegative(),
    maxNet: z.number().nonnegative(),
    take: z.number().int().min(1).max(50).optional(),
  }),
  z.object({
    type: z.literal("category"),
    categoryId: z.string().min(1),
    take: z.number().int().min(1).max(50).optional(),
  }),
  z.object({
    type: z.literal("fixed_products"),
    productIds: z.array(z.string().min(1)).min(1).max(100),
  }),
])

export type SuggestionSource = z.infer<typeof suggestionSourceSchema>

export const productSuggestionSettingsSchema = z.object({
  enabled: z.boolean(),
  /** When true, the pre-checkout modal lists current cart lines (even if there are no upsell suggestions). */
  showCartLinesInModal: z.boolean().optional().default(false),
  modalTitle: z.string().max(200).optional(),
  modalHelper: z.string().max(500).optional(),
  maxSuggestions: z.number().int().min(1).max(24),
  sources: z.array(suggestionSourceSchema).max(20),
})

export type ProductSuggestionSettings = z.infer<typeof productSuggestionSettingsSchema>

export const DEFAULT_PRODUCT_SUGGESTION_SETTINGS: ProductSuggestionSettings = {
  enabled: false,
  showCartLinesInModal: false,
  modalTitle: "Még valami a kosárba?",
  modalHelper: "Válassz javasolt termékeket, vagy lépj tovább a pénztárba.",
  maxSuggestions: 6,
  sources: [],
}

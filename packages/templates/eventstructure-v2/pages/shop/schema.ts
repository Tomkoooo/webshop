import { z } from "zod"

export const shopSchema = z.object({
  heading: z.string().default("Shop is not available."),
  meta: z
    .object({
      seoTitle: z.string().default("Shop"),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "Shop", seoDescription: "" }),
})

export type ShopContent = z.infer<typeof shopSchema>

import { z } from "zod"

export const shopSchema = z.object({
  heading: z.string().default(""),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type ShopContent = z.infer<typeof shopSchema>

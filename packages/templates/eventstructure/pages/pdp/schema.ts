import { z } from "zod"

export const pdpSchema = z.object({
  title: z.string().default(""),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type PdpContent = z.infer<typeof pdpSchema>

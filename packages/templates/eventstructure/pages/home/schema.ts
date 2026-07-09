import { z } from "zod"

export const homeSchema = z.object({
  heroImage: z.string().default("/generic-hero.svg"),
  meta: z
    .object({
      seoTitle: z.string().default("Event Structure"),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "Event Structure", seoDescription: "" }),
})

export type HomeContent = z.infer<typeof homeSchema>

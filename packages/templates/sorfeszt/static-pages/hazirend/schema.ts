import { z } from "zod"

export const houseRulesSchema = z.object({
  title: z.string().default("<p>Házirend</p>"),
  subtitle: z.string().default(""),
  body: z.string().default("<p></p>"),
  meta: z
    .object({
      seoTitle: z.string().default("Házirend"),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "Házirend", seoDescription: "" }),
})

export type HouseRulesContent = z.infer<typeof houseRulesSchema>

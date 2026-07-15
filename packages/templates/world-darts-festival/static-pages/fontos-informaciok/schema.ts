import { z } from "zod"

export const importantInfoSchema = z.object({
  title: z.string().default("Fontos információk"),
  subtitle: z.string().default(""),
  body: z.string().default("<p></p>"),
  meta: z
    .object({
      seoTitle: z.string().default("Fontos információk"),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "Fontos információk", seoDescription: "" }),
})

export type ImportantInfoContent = z.infer<typeof importantInfoSchema>

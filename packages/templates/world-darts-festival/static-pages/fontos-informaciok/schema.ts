import { z } from "zod"

export const importantInfoSchema = z.object({
  title: z.string().default("<p>Important information</p>"),
  subtitle: z.string().default(""),
  body: z.string().default("<p></p>"),
  meta: z
    .object({
      seoTitle: z.string().default("Important information"),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "Important information", seoDescription: "" }),
})

export type ImportantInfoContent = z.infer<typeof importantInfoSchema>

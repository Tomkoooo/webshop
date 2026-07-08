import { z } from "zod"

export const aboutSchema = z.object({
  hero: z.object({
    title: z.string().default("Rólunk"),
    subtitle: z.string().default(""),
    image: z.string().default(""),
  }),
  story: z.object({
    heading: z.string().default("A történetünk"),
    paragraphs: z.array(z.string()).default([]),
  }),
  highlights: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
      })
    )
    .max(8)
    .default([]),
  team: z
    .array(
      z.object({
        name: z.string(),
        role: z.string(),
        photo: z.string().default(""),
      })
    )
    .max(12)
    .default([]),
  cta: z.object({
    label: z.string().default("Lépj velünk kapcsolatba"),
    href: z.string().default("/#contact"),
  }),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type AboutContent = z.infer<typeof aboutSchema>

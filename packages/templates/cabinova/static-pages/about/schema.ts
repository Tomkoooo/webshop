import { z } from "zod"

const sectionLayout = z.enum(["imageRight", "imageLeft", "fullBleed"])

export const aboutSchema = z.object({
  hero: z.object({
    title: z.string().default("Studio"),
    subtitle: z.string().default(""),
    image: z.string().default(""),
  }),
  sections: z
    .array(
      z.object({
        heading: z.string().default(""),
        body: z.string().default(""),
        image: z.string().default(""),
        layout: sectionLayout.default("imageRight"),
      })
    )
    .max(12)
    .default([]),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type AboutContent = z.infer<typeof aboutSchema>

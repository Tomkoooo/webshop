import { z } from "zod"

const sectionSchema = z.object({
  heading: z.string().default(""),
  body: z.string().default(""),
  image: z.string().default(""),
})

const galleryItemSchema = z.object({
  image: z.string().default(""),
  caption: z.string().default(""),
})

export const sakkmedPageSchema = z.object({
  hero: z.object({
    title: z.string().default(""),
    subtitle: z.string().default(""),
    image: z.string().default(""),
  }),
  sections: z.array(sectionSchema).max(24).default([]),
  gallery: z.array(galleryItemSchema).max(64).default([]),
  contactEmail: z.string().default(""),
  contactLabel: z.string().default("Megrendelés és információ"),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type SakkmedPageContent = z.infer<typeof sakkmedPageSchema>

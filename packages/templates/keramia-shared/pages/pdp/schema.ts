import { z } from "zod"

const editorialSchema = z.object({
  eyebrow: z.string().default(""),
  title: z.string().default(""),
  body: z.string().default(""),
  highlights: z
    .array(
      z.object({
        label: z.string().default(""),
        detail: z.string().default(""),
      })
    )
    .default([]),
  supportTitle: z.string().default(""),
  supportBody: z.string().default(""),
  faq: z
    .array(
      z.object({
        question: z.string().default(""),
        answer: z.string().default(""),
      })
    )
    .default([]),
  ctaLabel: z.string().default(""),
  addedLabel: z.string().default(""),
})

export const pdpSchema = z.object({
  showRelatedProducts: z.boolean().default(true),
  showRecentlyViewed: z.boolean().default(false),
  ctaLabel: z.string().default("Kosárba"),
  outOfStockLabel: z.string().default("Elfogyott"),
  galleryStyle: z.enum(["thumbs", "carousel"]).default("thumbs"),
  introPlacement: z.enum(["aboveGrid", "belowHero"]).default("aboveGrid"),
  editorial: editorialSchema.default({
    eyebrow: "",
    title: "",
    body: "",
    highlights: [],
    supportTitle: "",
    supportBody: "",
    faq: [],
    ctaLabel: "",
    addedLabel: "",
  }),
})

export type PdpContent = z.infer<typeof pdpSchema>

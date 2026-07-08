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
  ctaLabel: z.string().default("Begin a project"),
  outOfStockLabel: z.string().default("Unavailable"),
  galleryStyle: z.enum(["thumbs", "carousel"]).default("thumbs"),
  introPlacement: z.enum(["aboveGrid", "belowHero"]).default("belowHero"),
  heroEyebrow: z.string().default(""),
  tagline: z.string().default(""),
  overviewBody: z.string().default(""),
  specs: z
    .array(
      z.object({
        label: z.string().default(""),
        value: z.string().default(""),
      })
    )
    .default([
      { label: "Area", value: "" },
      { label: "Bedrooms", value: "" },
      { label: "Lead time", value: "" },
      { label: "From", value: "" },
    ]),
  materials: z.array(z.string()).default([]),
  detailImage: z.string().default(""),
  detailCaption: z.string().default(""),
  ctaTitle: z.string().default(""),
  ctaBody: z.string().default(""),
  ctaHref: z.string().default("/contact"),
  showNextModel: z.boolean().default(true),
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

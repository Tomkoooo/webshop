import { z } from "zod"

const practiceAreaSchema = z.object({
  icon: z.string().default("generic"),
  title: z.string().default(""),
  description: z.string().default(""),
})

const testimonialSchema = z.object({
  quote: z.string().default(""),
  author: z.string().default(""),
})

export const homeSchema = z.object({
  hero: z
    .object({
      logoText: z.string().default("JS"),
      title: z.string().default(""),
      tagline: z.string().default(""),
      ctaLabel: z.string().default(""),
      ctaHref: z.string().default("#kapcsolat"),
      image: z.string().default(""),
      imageAlt: z.string().default(""),
    })
    .default({
      logoText: "JS",
      title: "",
      tagline: "",
      ctaLabel: "",
      ctaHref: "#kapcsolat",
      image: "",
      imageAlt: "",
    }),
  about: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      body: z.string().default(""),
      ctaLabel: z.string().default(""),
      ctaHref: z.string().default("#bemutatkozas"),
      image: z.string().default(""),
      imageAlt: z.string().default(""),
    })
    .default({
      eyebrow: "",
      title: "",
      body: "",
      ctaLabel: "",
      ctaHref: "#bemutatkozas",
      image: "",
      imageAlt: "",
    }),
  practiceAreas: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      ctaLabel: z.string().default(""),
      ctaHref: z.string().default("#szakteruletek"),
      items: z.array(practiceAreaSchema).max(8).default([]),
    })
    .default({ eyebrow: "", title: "", ctaLabel: "", ctaHref: "#szakteruletek", items: [] }),
  testimonials: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      items: z.array(testimonialSchema).max(8).default([]),
    })
    .default({ eyebrow: "", title: "", items: [] }),
  quote: z
    .object({
      text: z.string().default(""),
      image: z.string().default(""),
      imageAlt: z.string().default(""),
    })
    .default({ text: "", image: "", imageAlt: "" }),
  contact: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      phoneLabel: z.string().default("Telefon"),
      emailLabel: z.string().default("E-mail"),
      addressLabel: z.string().default("Cím"),
      phone: z.string().default(""),
      email: z.string().default(""),
      address: z.string().default(""),
      image: z.string().default(""),
      imageAlt: z.string().default(""),
      callEyebrow: z.string().default(""),
      callLabel: z.string().default(""),
      callHint: z.string().default(""),
    })
    .default({
      eyebrow: "",
      title: "",
      phoneLabel: "Telefon",
      emailLabel: "E-mail",
      addressLabel: "Cím",
      phone: "",
      email: "",
      address: "",
      image: "",
      imageAlt: "",
      callEyebrow: "",
      callLabel: "",
      callHint: "",
    }),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type HomeContent = z.infer<typeof homeSchema>
export type PracticeAreaIcon = "family" | "civil" | "property" | "health" | "labor" | "generic"

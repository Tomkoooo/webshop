import { z } from "zod"

const benefitSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
})

const discountBadgeSchema = z.object({
  value: z.string().default(""),
  label: z.string().default(""),
})

const processStepSchema = z.object({
  number: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  duration: z.string().default(""),
})

const serviceItemSchema = z.object({
  badge: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
  ctaLabel: z.string().default(""),
})

const resultItemSchema = z.object({
  category: z.string().default(""),
  title: z.string().default(""),
  description: z.string().default(""),
})

const faqItemSchema = z.object({
  question: z.string().default(""),
  answer: z.string().default(""),
})

const formOptionSchema = z.object({
  value: z.string().default(""),
  label: z.string().default(""),
})

export const campaignPageSchema = z.object({
  locale: z.enum(["hu", "en"]).default("hu"),
  hero: z
    .object({
      badge: z.string().default(""),
      title: z.string().default(""),
      /** Gold semibold line directly under the headline (reference demos). */
      tagline: z.string().default(""),
      subtitle: z.string().default(""),
      promoHighlight: z.string().default(""),
      promoSubtext: z.string().default(""),
      ctaLabel: z.string().default(""),
      phone: z.string().default(""),
      location: z.string().default(""),
      image: z.string().default(""),
    })
    .default({
      badge: "",
      title: "",
      tagline: "",
      subtitle: "",
      promoHighlight: "",
      promoSubtext: "",
      ctaLabel: "",
      phone: "",
      location: "",
      image: "",
    }),
  benefits: z.array(benefitSchema).max(8).default([]),
  offer: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      body: z.string().default(""),
      bullets: z.array(z.string()).max(16).default([]),
      discounts: z.array(discountBadgeSchema).max(4).default([]),
      footnotes: z.array(z.string()).max(6).default([]),
    })
    .default({
      eyebrow: "",
      title: "",
      body: "",
      bullets: [],
      discounts: [],
      footnotes: [],
    }),
  process: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      subtitle: z.string().default(""),
      steps: z.array(processStepSchema).max(8).default([]),
    })
    .default({ eyebrow: "", title: "", subtitle: "", steps: [] }),
  services: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      subtitle: z.string().default(""),
      items: z.array(serviceItemSchema).max(12).default([]),
    })
    .default({ eyebrow: "", title: "", subtitle: "", items: [] }),
  beforeAfter: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      beforeLabel: z.string().default(""),
      afterLabel: z.string().default(""),
      caption: z.string().default(""),
      beforeImage: z.string().default(""),
      afterImage: z.string().default(""),
    })
    .default({
      eyebrow: "",
      title: "",
      beforeLabel: "",
      afterLabel: "",
      caption: "",
      beforeImage: "",
      afterImage: "",
    }),
  results: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      body: z.string().default(""),
      stats: z.array(z.object({ value: z.string().default(""), label: z.string().default("") })).max(6).default([]),
      items: z.array(resultItemSchema).max(8).default([]),
    })
    .default({ eyebrow: "", title: "", body: "", stats: [], items: [] }),
  why: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      tip: z.string().default(""),
      body: z.string().default(""),
      bullets: z.array(z.string()).max(12).default([]),
    })
    .default({ eyebrow: "", title: "", tip: "", body: "", bullets: [] }),
  faq: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      items: z.array(faqItemSchema).max(16).default([]),
    })
    .default({ eyebrow: "", title: "", items: [] }),
  ctaBand: z
    .object({
      title: z.string().default(""),
      subtitle: z.string().default(""),
      bullets: z.array(z.string()).max(6).default([]),
      ctaLabel: z.string().default(""),
    })
    .default({ title: "", subtitle: "", bullets: [], ctaLabel: "" }),
  contact: z
    .object({
      eyebrow: z.string().default(""),
      title: z.string().default(""),
      subtitle: z.string().default(""),
      nameLabel: z.string().default(""),
      phoneLabel: z.string().default(""),
      emailLabel: z.string().default(""),
      interestLabel: z.string().default(""),
      messageLabel: z.string().default(""),
      privacyText: z.string().default(""),
      submitLabel: z.string().default(""),
      interestOptions: z.array(formOptionSchema).max(16).default([]),
    })
    .default({
      eyebrow: "",
      title: "",
      subtitle: "",
      nameLabel: "",
      phoneLabel: "",
      emailLabel: "",
      interestLabel: "",
      messageLabel: "",
      privacyText: "",
      submitLabel: "",
      interestOptions: [],
    }),
  meta: z
    .object({
      seoTitle: z.string().default(""),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "", seoDescription: "" }),
})

export type CampaignPageContent = z.infer<typeof campaignPageSchema>

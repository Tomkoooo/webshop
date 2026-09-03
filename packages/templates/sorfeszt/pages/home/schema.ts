import { z } from "zod"
import { tBookHomeChromeSchema } from "@wse/plugin-t-book/lib/storefront-chrome"
import {
  sorfesztSectionLayoutEntrySchema,
  DEFAULT_SORFESZT_SECTION_LAYOUT,
} from "../../lib/sorfeszt-home-sections"

const navLinkSchema = z.object({
  label: z.string(),
  href: z.string(),
})

const navItemSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("link"), label: z.string(), href: z.string() }),
  z.object({
    type: z.literal("dropdown"),
    label: z.string(),
    items: z.array(navLinkSchema).default([]),
  }),
])

const ticketCardSchema = z.object({
  name: z.string(),
  price: z.string(),
  badge: z.string().default(""),
  includes: z.array(z.string()).default([]),
  ctaLabel: z.string().default("Jegyvásárlás"),
  ctaHref: z.string().default("/jegyek"),
})

const scheduleItemSchema = z.object({
  time: z.string(),
  title: z.string(),
})

const scheduleDaySchema = z.object({
  date: z.string(),
  title: z.string(),
  hours: z.string().default(""),
  accent: z.enum(["primary", "secondary", "accent"]).default("primary"),
  items: z.array(scheduleItemSchema).default([]),
})

const hoursRowSchema = z.object({
  day: z.string(),
  hours: z.string(),
})

const galleryItemSchema = z.object({
  image: z.string(),
  caption: z.string().default(""),
})

export const homeSchema = z.object({
  chrome: tBookHomeChromeSchema,
  sectionLayout: z.array(sorfesztSectionLayoutEntrySchema).default(DEFAULT_SORFESZT_SECTION_LAYOUT),
  hero: z.object({
    tagline: z.string(),
    title: z.string(),
    subtitle: z.string(),
    heroImage: z.string(),
    primaryCtaLabel: z.string(),
    primaryCtaHref: z.string(),
    secondaryCtaLabel: z.string(),
    secondaryCtaHref: z.string(),
  }),
  venue: z.object({
    heading: z.string(),
    name: z.string(),
    body: z.string(),
    mapLabel: z.string(),
    mapHref: z.string(),
    mapEmbedUrl: z.string().default(""),
    image: z.string().default(""),
  }),
  tickets: z.object({
    heading: z.string(),
    intro: z.string().default(""),
    cards: z.array(ticketCardSchema).default([]),
  }),
  ribbons: z
    .object({
      beforeTickets: z.string().default(""),
      afterBeers: z.string().default(""),
    })
    .default({ beforeTickets: "", afterBeers: "" }),
  beers: z.object({
    heading: z.string(),
    body: z.string(),
  }),
  schedule: z.object({
    heading: z.string(),
    intro: z.string().default(""),
    days: z.array(scheduleDaySchema).default([]),
  }),
  hours: z.object({
    heading: z.string(),
    intro: z.string().default(""),
    days: z.array(hoursRowSchema).default([]),
  }),
  gallery: z.object({
    heading: z.string(),
    emptyLabel: z.string().default("Hamarosan"),
    items: z.array(galleryItemSchema).default([]),
  }),
  contact: z.object({
    heading: z.string(),
    body: z.string(),
    nameLabel: z.string(),
    emailLabel: z.string(),
    messageLabel: z.string(),
    sendButtonLabel: z.string(),
  }),
  meta: z
    .object({
      seoTitle: z.string().default("Sörfeszt"),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "Sörfeszt", seoDescription: "" }),
})

export type HomeContent = z.infer<typeof homeSchema>
export type HomeNavItem = z.infer<typeof navItemSchema>

import { z } from "zod"
import { tBookHomeChromeSchema } from "@wse/plugin-t-book/lib/storefront-chrome"
import {
  wdfSectionLayoutEntrySchema,
  DEFAULT_WDF_SECTION_LAYOUT,
} from "../../lib/wdf-home-sections"

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

const infoCardSchema = z.object({
  title: z.string(),
  body: z.string(),
  ctaLabel: z.string(),
  ctaHref: z.string(),
})

const scheduleDaySchema = z.object({
  date: z.string(),
  title: z.string(),
  items: z.array(z.string()).default([]),
})

const feeItemSchema = z.object({
  label: z.string(),
  price: z.string(),
  badge: z.string().default(""),
})

const prizeTableSchema = z.object({
  title: z.string(),
  subtitle: z.string().default(""),
  headers: z.array(z.string()).default([]),
  rows: z.array(z.array(z.string())).default([]),
})

const sponsorSchema = z.object({
  name: z.string(),
  image: z.string(),
})

export const homeSchema = z.object({
  chrome: tBookHomeChromeSchema,
  sectionLayout: z.array(wdfSectionLayoutEntrySchema).default(DEFAULT_WDF_SECTION_LAYOUT),
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
  festival: z.object({
    title: z.string(),
    body: z.string(),
    image: z.string(),
    ctaLabel: z.string(),
    ctaHref: z.string(),
  }),
  infoCards: z.array(infoCardSchema).default([]),
  venue: z.object({
    heading: z.string(),
    name: z.string(),
    body: z.string(),
    accessHeading: z.string(),
    accessBody: z.string(),
    mapLabel: z.string(),
    mapHref: z.string(),
    /** Google Maps embed URL (`https://www.google.com/maps/embed?...`). */
    mapEmbedUrl: z.string().default(""),
    /** Venue photo (shown instead of the access text card). */
    image: z.string().default(""),
  }),
  schedule: z.object({
    heading: z.string(),
    days: z.array(scheduleDaySchema).default([]),
  }),
  fees: z.object({
    heading: z.string(),
    items: z.array(feeItemSchema).default([]),
    ctaLabel: z.string(),
    ctaHref: z.string(),
  }),
  prizeMoney: z.object({
    heading: z.string(),
    intro: z.string().default(""),
    tables: z.array(prizeTableSchema).default([]),
  }),
  sponsors: z.object({
    heading: z.string(),
    logos: z.array(sponsorSchema).default([]),
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
      seoTitle: z.string().default("World Darts Festival"),
      seoDescription: z.string().default(""),
    })
    .default({ seoTitle: "World Darts Festival", seoDescription: "" }),
})

export type HomeContent = z.infer<typeof homeSchema>
export type HomeNavItem = z.infer<typeof navItemSchema>

import { z } from "zod"

export const homepageBlockTypeSchema = z.enum([
  "hero",
  "about",
  "videoCarousel",
  "features",
  "productGrid",
  "contact",
  "testimonials",
  "cta",
  "gallery",
  "richText",
  "divider",
])

const visibilitySchema = z.record(z.string(), z.boolean()).optional()

const heroDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  primaryCtaLabel: z.string(),
  primaryCtaHref: z.string(),
  secondaryCtaLabel: z.string(),
  secondaryCtaHref: z.string(),
  heroImage: z.string(),
  heroImages: z.array(z.string()).optional(),
  imageDurationSeconds: z.number().int().min(1).max(30).optional(),
  heroDurationSeconds: z.number().int().min(1).max(60).optional(),
  heroSlides: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        primaryCtaLabel: z.string(),
        primaryCtaHref: z.string(),
        secondaryCtaLabel: z.string(),
        secondaryCtaHref: z.string(),
        badges: z.array(z.string()),
        images: z.array(z.string()),
        imageDurationSeconds: z.number().int().min(1).max(30),
        durationSeconds: z.number().int().min(1).max(60),
      })
    )
    .optional(),
  badges: z.array(z.string()),
  visibility: visibilitySchema,
})

const aboutDataSchema = z.object({
  title: z.string(),
  paragraph: z.string(),
  /** Story section image URL (Minecraft camp / custom layouts). */
  image: z.string().optional(),
  /** Heading inside the wood content box. */
  boxHeading: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  bannerText: z.string().optional(),
  /** Optional link for camp story green promo strip */
  bannerHref: z.string().optional(),
  accordions: z.array(z.object({ title: z.string(), content: z.string() })),
  cards: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string().optional() })),
  visibility: visibilitySchema,
})

const featuresDataSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  cards: z.array(z.object({ title: z.string(), description: z.string(), icon: z.string().optional() })),
  visibility: visibilitySchema,
})

const productGridDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  viewAllLabel: z.string().optional(),
  viewAllHref: z.string().optional(),
  categoriesTitle: z.string(),
  categoriesDescription: z.string(),
  layout: z.enum(["grid", "carousel"]),
  maxItems: z.number().int().min(1).max(24),
  selectedProductIds: z.array(z.string()),
  visibility: visibilitySchema,
})

const contactDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  companyName: z.string(),
  address: z.string(),
  /** Short venue label for navbar / hero badge (e.g. "Récsei Center, 2026 nyár"). */
  venueShort: z.string().optional(),
  /** Google Maps embed iframe `src` URL. */
  mapEmbedUrl: z.string().optional(),
  phone: z.string(),
  email: z.string(),
  sendButtonLabel: z.string().optional(),
  nameLabel: z.string().optional(),
  emailLabel: z.string().optional(),
  messageLabel: z.string().optional(),
  warehouseTitle: z.string().optional(),
  warehouseBody: z.string().optional(),
  officeTaxId: z.string().optional(),
  officeManagerLine: z.string().optional(),
  btlBlock: z.string().optional(),
  financeBlock: z.string().optional(),
  visibility: visibilitySchema,
})

const testimonialsDataSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  items: z.array(
    z.object({
      quote: z.string(),
      name: z.string(),
      role: z.string(),
      sourceUrl: z.string().optional(),
      rating: z.number().min(1).max(5),
    })
  ),
  visibility: visibilitySchema,
})

const ctaDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  primaryLabel: z.string(),
  primaryHref: z.string(),
  secondaryLabel: z.string(),
  secondaryHref: z.string(),
  variant: z.enum(["solid", "muted"]),
  visibility: visibilitySchema,
})

const galleryDataSchema = z.object({
  title: z.string(),
  items: z.array(z.object({ image: z.string(), caption: z.string() })),
  visibility: visibilitySchema,
})

const videoCarouselDataSchema = z.object({
  title: z.string(),
  items: z.array(z.object({ url: z.string(), caption: z.string().optional() })),
  visibility: visibilitySchema,
})

const richTextDataSchema = z.object({
  title: z.string(),
  html: z.string(),
  visibility: visibilitySchema,
})

const dividerDataSchema = z.object({
  label: z.string(),
  visibility: visibilitySchema,
})

export const homepageBlockSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string().min(1), type: z.literal("hero"), enabled: z.boolean().default(true), data: heroDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("about"), enabled: z.boolean().default(true), data: aboutDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("videoCarousel"), enabled: z.boolean().default(true), data: videoCarouselDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("features"), enabled: z.boolean().default(true), data: featuresDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("productGrid"), enabled: z.boolean().default(true), data: productGridDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("contact"), enabled: z.boolean().default(true), data: contactDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("testimonials"), enabled: z.boolean().default(true), data: testimonialsDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("cta"), enabled: z.boolean().default(true), data: ctaDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("gallery"), enabled: z.boolean().default(true), data: galleryDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("richText"), enabled: z.boolean().default(true), data: richTextDataSchema }),
  z.object({ id: z.string().min(1), type: z.literal("divider"), enabled: z.boolean().default(true), data: dividerDataSchema }),
])

export const homepageSnapshotSchema = z.object({
  blocks: z.array(homepageBlockSchema),
  meta: z.object({
    seoTitle: z.string().default(""),
    seoDescription: z.string().default(""),
  }),
})

export type HomepageSnapshotInput = z.infer<typeof homepageSnapshotSchema>

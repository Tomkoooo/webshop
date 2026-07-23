export type HomepageBlockType =
  | "hero"
  | "about"
  | "videoCarousel"
  | "features"
  | "productGrid"
  | "contact"
  | "testimonials"
  | "cta"
  | "gallery"
  | "richText"
  | "divider"

export type HomepageBlockBase<TType extends HomepageBlockType, TData> = {
  id: string
  type: TType
  enabled: boolean
  data: TData
}

export type FieldVisibility = Partial<Record<string, boolean>>

export type HeroBlock = HomepageBlockBase<
  "hero",
  {
    title: string
    description: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    heroImage: string
    heroImages?: string[]
    imageDurationSeconds?: number
    heroDurationSeconds?: number
    heroSlides?: Array<{
      title: string
      description: string
      primaryCtaLabel: string
      primaryCtaHref: string
      secondaryCtaLabel: string
      secondaryCtaHref: string
      badges: string[]
      images: string[]
      imageDurationSeconds: number
      durationSeconds: number
    }>
    badges: string[]
    visibility?: FieldVisibility
  }
>

export type AboutBlock = HomepageBlockBase<
  "about",
  {
    title: string
    paragraph: string
    accordions: Array<{ title: string; content: string }>
    cards: Array<{ title: string; description: string; icon?: string }>
    /** Story / camp layout (minecraft-camp template) */
    image?: string
    boxHeading?: string
    ctaLabel?: string
    ctaHref?: string
    bannerText?: string
    bannerHref?: string
    visibility?: FieldVisibility
  }
>

export type ProductGridBlock = HomepageBlockBase<
  "productGrid",
  {
    title: string
    description: string
    viewAllLabel?: string
    viewAllHref?: string
    categoriesTitle: string
    categoriesDescription: string
    layout: "grid" | "carousel"
    maxItems: number
    selectedProductIds: string[]
    visibility?: FieldVisibility
  }
>

export type FeaturesBlock = HomepageBlockBase<
  "features",
  {
    title: string
    subtitle: string
    cards: Array<{
      title: string
      description: string
      icon?: string
    }>
    visibility?: FieldVisibility
  }
>

export type ContactBlock = HomepageBlockBase<
  "contact",
  {
    title: string
    description: string
    companyName: string
    address: string
    phone: string
    email: string
    sendButtonLabel?: string
    nameLabel?: string
    emailLabel?: string
  messageLabel?: string
  /** Camp / venue layout */
  venueShort?: string
  mapEmbedUrl?: string
  /** SAKKMED-style contact detail blocks (optional). */
  warehouseTitle?: string
  warehouseBody?: string
  officeTaxId?: string
  officeManagerLine?: string
  btlBlock?: string
  financeBlock?: string
  visibility?: FieldVisibility
  }
>

export type TestimonialsBlock = HomepageBlockBase<
  "testimonials",
  {
    title: string
    subtitle: string
    items: Array<{
      quote: string
      name: string
      role: string
      sourceUrl?: string
      rating: number
    }>
    visibility?: FieldVisibility
  }
>

export type CtaBlock = HomepageBlockBase<
  "cta",
  {
    title: string
    description: string
    primaryLabel: string
    primaryHref: string
    secondaryLabel: string
    secondaryHref: string
    variant: "solid" | "muted"
    visibility?: FieldVisibility
  }
>

export type GalleryBlock = HomepageBlockBase<
  "gallery",
  {
    title: string
    items: Array<{ image: string; caption: string }>
    visibility?: FieldVisibility
  }
>

export type VideoCarouselBlock = HomepageBlockBase<
  "videoCarousel",
  {
    title: string
    items: Array<{ url: string; caption?: string }>
    visibility?: FieldVisibility
  }
>

export type RichTextBlock = HomepageBlockBase<
  "richText",
  {
    title: string
    html: string
    visibility?: FieldVisibility
  }
>

export type DividerBlock = HomepageBlockBase<
  "divider",
  {
    label: string
    visibility?: FieldVisibility
  }
>

export type HomepageBlock =
  | HeroBlock
  | AboutBlock
  | VideoCarouselBlock
  | FeaturesBlock
  | ProductGridBlock
  | ContactBlock
  | TestimonialsBlock
  | CtaBlock
  | GalleryBlock
  | RichTextBlock
  | DividerBlock

export type HomepageMeta = {
  seoTitle: string
  seoDescription: string
}

export type HomepageSnapshot = {
  blocks: HomepageBlock[]
  meta: HomepageMeta
}

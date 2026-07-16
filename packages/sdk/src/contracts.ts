/**
 * Engine ↔ template/plugin data contracts.
 *
 * These shapes are produced by @wse/core services and consumed by template and
 * plugin packages. They live in the SDK so template packages depend only on
 * @wse/sdk for types.
 */

export type FooterSocialLink = {
  platform: "facebook" | "instagram" | "twitter" | "youtube"
  enabled: boolean
  url: string
}

export type FooterOrganizerSection = {
  title: string
  companyName: string
  registeredAddress: string
  mailingAddress: string
  openingHours: string
  /** Tax / VAT ID (adószám) shown in the organizer block. */
  taxNumber?: string
}

export type FooterContactEntry = {
  label: string
  value: string
  kind: "text" | "link" | "mailto" | "tel"
}

export type FooterSettings = {
  tagline: string
  quickLinksTitle: string
  quickLinks: Array<{ label: string; href: string }>
  categoriesTitle: string
  browseProductsLabel: string
  contactTitle: string
  newsletterLabel: string
  newsletterPlaceholder: string
  copyrightText: string
  socialLinks: FooterSocialLink[]
  /** Structured contact rows shown in footer (overrides legacy email/phone when set). */
  contactEntries?: FooterContactEntry[]
  /** Mineshow / camp footer — szervező blokk */
  organizerSection?: FooterOrganizerSection
  /** Pl. „Fizetés: bankkártya (Stripe)” */
  paymentMethodsNote?: string
}

/** Admin-managed contact e-mail entry. */
export type SiteContactEntry = {
  id: string
  label: string
  email: string
}

/** Site-wide contact channels for storefront + template `deps.siteContact`. */
export type SiteContact = {
  emails: SiteContactEntry[]
  primaryEmail: string
  emailsDisplay: string
  phone: string
  address: string
}

export type EmailTemplateSeed = {
  type: string
  subject: string
  body: string
  description?: string
  variables?: string[]
  tags?: string[]
  pluginId?: string | null
}

/** Editorial copy rendered around the engine PDP body. */
export type ProductDetailEditorial = {
  eyebrow?: string
  title?: string
  body?: string
  highlights?: Array<{ label: string; detail: string }>
  supportTitle?: string
  supportBody?: string
  faq?: Array<{ question: string; answer: string }>
  ctaLabel?: string
  addedLabel?: string
}

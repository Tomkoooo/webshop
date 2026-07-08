import dbConnect from "@wse/core/lib/db"
import FooterSetting from "@wse/core/models/FooterSetting"

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
  /** Mineshow / camp footer — szervező blokk */
  organizerSection?: FooterOrganizerSection
  /** Pl. „Fizetés: bankkártya (Stripe)” */
  paymentMethodsNote?: string
}

const DEFAULT_ORGANIZER: FooterOrganizerSection = {
  title: "A KockaKemp tábor szervezője az Eseményszervezés.hu BTL ügynökség Kft.",
  companyName: "",
  registeredAddress: "",
  mailingAddress: "",
  openingHours: "",
}

const DEFAULT_PAYMENT_NOTE = "Fizetés: bankkártya (Stripe)"

const DEFAULTS: FooterSettings = {
  tagline: "Minőségi termékek, gyors szállítás.",
  quickLinksTitle: "Linkek",
  quickLinks: [
    { label: "Főoldal", href: "#home" },
    { label: "Rólunk", href: "#about" },
    { label: "Termékek", href: "#shop" },
    { label: "Vélemények", href: "#reviews" },
    { label: "Kapcsolat", href: "#contact" },
  ],
  categoriesTitle: "Kategóriák",
  browseProductsLabel: "Termékek böngészése",
  contactTitle: "Kapcsolat",
  newsletterLabel: "Hírlevél",
  newsletterPlaceholder: "E-mail cím",
  copyrightText: "© {year} {brand}. Minden jog fenntartva.",
  socialLinks: [
    { platform: "facebook", enabled: false, url: "" },
    { platform: "instagram", enabled: false, url: "" },
    { platform: "twitter", enabled: false, url: "" },
    { platform: "youtube", enabled: false, url: "" },
  ],
}

function normalize(settings?: Partial<FooterSettings>): FooterSettings {
  const quickLinks =
    Array.isArray(settings?.quickLinks) && settings.quickLinks.length > 0
      ? settings.quickLinks.map((item) => ({
          label: String(item.label || ""),
          href: String(item.href || ""),
        }))
      : DEFAULTS.quickLinks.map((item) => ({ ...item }))

  const socialLinks =
    Array.isArray(settings?.socialLinks) && settings.socialLinks.length > 0
      ? settings.socialLinks.map((item) => ({
          platform: item.platform,
          enabled: Boolean(item.enabled),
          url: String(item.url || ""),
        }))
      : DEFAULTS.socialLinks.map((item) => ({ ...item }))

  return {
    tagline: settings?.tagline || DEFAULTS.tagline,
    quickLinksTitle: settings?.quickLinksTitle || DEFAULTS.quickLinksTitle,
    quickLinks,
    categoriesTitle: settings?.categoriesTitle || DEFAULTS.categoriesTitle,
    browseProductsLabel: settings?.browseProductsLabel || DEFAULTS.browseProductsLabel,
    contactTitle: settings?.contactTitle || DEFAULTS.contactTitle,
    newsletterLabel: settings?.newsletterLabel || DEFAULTS.newsletterLabel,
    newsletterPlaceholder: settings?.newsletterPlaceholder || DEFAULTS.newsletterPlaceholder,
    copyrightText: settings?.copyrightText || DEFAULTS.copyrightText,
    socialLinks,
    organizerSection: {
      title: settings?.organizerSection?.title || DEFAULT_ORGANIZER.title,
      companyName: settings?.organizerSection?.companyName || DEFAULT_ORGANIZER.companyName,
      registeredAddress:
        settings?.organizerSection?.registeredAddress || DEFAULT_ORGANIZER.registeredAddress,
      mailingAddress:
        settings?.organizerSection?.mailingAddress || DEFAULT_ORGANIZER.mailingAddress,
      openingHours: settings?.organizerSection?.openingHours || DEFAULT_ORGANIZER.openingHours,
    },
    paymentMethodsNote: settings?.paymentMethodsNote || DEFAULT_PAYMENT_NOTE,
  }
}

export class FooterSettingsService {
  static defaults() {
    return DEFAULTS
  }

  static async get(): Promise<FooterSettings> {
    await dbConnect()
    const doc = await FooterSetting.findOneAndUpdate(
      { key: "footer" },
      { $setOnInsert: { key: "footer", ...DEFAULTS } },
      { upsert: true, returnDocument: "after", lean: true }
    )
    return normalize(doc as Partial<FooterSettings>)
  }

  static async update(input: Partial<FooterSettings>): Promise<FooterSettings> {
    await dbConnect()
    const merged = { ...(await this.get()), ...input }
    const normalized = normalize(merged)
    await FooterSetting.findOneAndUpdate({ key: "footer" }, { $set: normalized }, { upsert: true })
    return normalized
  }
}

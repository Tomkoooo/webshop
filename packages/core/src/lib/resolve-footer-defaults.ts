import type { FooterSettings } from "@wse/core/services/footer-settings"
import type { TemplateModule } from "@wse/sdk/templates/types"

/** Engine-wide shop footer baseline when a template does not declare `footerDefaults`. */
export const ENGINE_SHOP_FOOTER_DEFAULTS: FooterSettings = {
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
  contactEntries: [],
  organizerSection: {
    title: "",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours: "",
    taxNumber: "",
  },
  paymentMethodsNote: "",
}

export function resolveFooterDefaults(
  template: TemplateModule | null | undefined,
  locale?: string
): FooterSettings {
  const localeDefaults =
    locale && locale !== "en" ? template?.footerDefaultsByLocale?.[locale] : undefined
  const source = localeDefaults ?? template?.footerDefaults
  if (source) {
    return {
      ...ENGINE_SHOP_FOOTER_DEFAULTS,
      ...source,
      quickLinks: source.quickLinks?.length
        ? source.quickLinks.map((item) => ({ ...item }))
        : ENGINE_SHOP_FOOTER_DEFAULTS.quickLinks.map((item) => ({ ...item })),
      socialLinks: source.socialLinks?.length
        ? source.socialLinks.map((item) => ({ ...item }))
        : ENGINE_SHOP_FOOTER_DEFAULTS.socialLinks.map((item) => ({ ...item })),
      contactEntries: source.contactEntries?.map((item) => ({ ...item })) ?? [],
      organizerSection: {
        ...ENGINE_SHOP_FOOTER_DEFAULTS.organizerSection!,
        ...source.organizerSection,
      },
    }
  }
  return {
    ...ENGINE_SHOP_FOOTER_DEFAULTS,
    quickLinks: ENGINE_SHOP_FOOTER_DEFAULTS.quickLinks.map((item) => ({ ...item })),
    socialLinks: ENGINE_SHOP_FOOTER_DEFAULTS.socialLinks.map((item) => ({ ...item })),
  }
}

const SHOP_DEFAULT_HREFS = new Set(["#home", "#about", "#shop", "#reviews", "#contact"])

/** Whether a legacy global `footer` row should seed the template-scoped footer. */
export function shouldMigrateLegacyFooter(
  templateId: string,
  legacy: Partial<FooterSettings>
): boolean {
  if (templateId === "minecraft-camp") return true
  return !isLegacyShopOrCampFooter(legacy)
}

/** True when legacy global footer looks like shop/KockaKemp seed data, not operator customization. */
export function isLegacyShopOrCampFooter(legacy: Partial<FooterSettings>): boolean {
  const organizerTitle = legacy.organizerSection?.title?.trim() ?? ""
  if (organizerTitle.includes("KockaKemp") || organizerTitle.includes("Eseményszervezés")) {
    return true
  }
  const payment = legacy.paymentMethodsNote?.trim() ?? ""
  if (payment.includes("Stripe")) return true

  const links = legacy.quickLinks ?? []
  if (links.length > 0 && links.every((item) => SHOP_DEFAULT_HREFS.has(item.href))) {
    return true
  }
  const tagline = legacy.tagline?.trim() ?? ""
  if (tagline === ENGINE_SHOP_FOOTER_DEFAULTS.tagline) return true
  return false
}

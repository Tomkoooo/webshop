import dbConnect from "@wse/core/lib/db"
import {
  ENGINE_SHOP_FOOTER_DEFAULTS,
  resolveFooterDefaults,
  shouldMigrateLegacyFooter,
} from "@wse/core/lib/resolve-footer-defaults"
import FooterSetting from "@wse/core/models/FooterSetting"
import type { TemplateModule } from "@wse/sdk/templates/types"

export type FooterSocialLink = {
  platform: "facebook" | "instagram" | "twitter" | "youtube"
  enabled: boolean
  url: string
}

export type FooterContactEntry = {
  label: string
  value: string
  kind: "text" | "link" | "mailto" | "tel"
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
  /** Structured contact rows shown in footer (overrides legacy email/phone when set). */
  contactEntries?: FooterContactEntry[]
  /** Mineshow / camp footer — szervező blokk */
  organizerSection?: FooterOrganizerSection
  /** Pl. „Fizetés: bankkártya (Stripe)” */
  paymentMethodsNote?: string
}

const LEGACY_FOOTER_KEY = "footer"

export function footerKeyForTemplate(templateId: string): string {
  return `footer:${templateId}`
}

function normalize(
  settings: Partial<FooterSettings> | undefined,
  defaults: FooterSettings
): FooterSettings {
  const quickLinks =
    Array.isArray(settings?.quickLinks) && settings.quickLinks.length > 0
      ? settings.quickLinks.map((item) => ({
          label: String(item.label || ""),
          href: String(item.href || ""),
        }))
      : defaults.quickLinks.map((item) => ({ ...item }))

  const socialLinks =
    Array.isArray(settings?.socialLinks) && settings.socialLinks.length > 0
      ? settings.socialLinks.map((item) => ({
          platform: item.platform,
          enabled: Boolean(item.enabled),
          url: String(item.url || ""),
        }))
      : defaults.socialLinks.map((item) => ({ ...item }))

  const defaultOrganizer = defaults.organizerSection ?? {
    title: "",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours: "",
  }

  return {
    tagline: settings?.tagline?.trim() ? settings.tagline : defaults.tagline,
    quickLinksTitle: settings?.quickLinksTitle?.trim()
      ? settings.quickLinksTitle
      : defaults.quickLinksTitle,
    quickLinks,
    categoriesTitle: settings?.categoriesTitle?.trim()
      ? settings.categoriesTitle
      : defaults.categoriesTitle,
    browseProductsLabel: settings?.browseProductsLabel?.trim()
      ? settings.browseProductsLabel
      : defaults.browseProductsLabel,
    contactTitle: settings?.contactTitle?.trim() ? settings.contactTitle : defaults.contactTitle,
    newsletterLabel: settings?.newsletterLabel?.trim()
      ? settings.newsletterLabel
      : defaults.newsletterLabel,
    newsletterPlaceholder: settings?.newsletterPlaceholder?.trim()
      ? settings.newsletterPlaceholder
      : defaults.newsletterPlaceholder,
    copyrightText: settings?.copyrightText?.trim()
      ? settings.copyrightText
      : defaults.copyrightText,
    socialLinks,
    contactEntries: Array.isArray(settings?.contactEntries)
      ? settings.contactEntries.map((item) => ({
          label: String(item.label || ""),
          value: String(item.value || ""),
          kind:
            item.kind === "link" || item.kind === "mailto" || item.kind === "tel"
              ? item.kind
              : ("text" as const),
        }))
      : (defaults.contactEntries ?? []).map((item) => ({ ...item })),
    organizerSection: {
      title: settings?.organizerSection?.title?.trim()
        ? settings.organizerSection.title
        : defaultOrganizer.title,
      companyName: settings?.organizerSection?.companyName?.trim()
        ? settings.organizerSection.companyName
        : defaultOrganizer.companyName,
      registeredAddress: settings?.organizerSection?.registeredAddress?.trim()
        ? settings.organizerSection.registeredAddress
        : defaultOrganizer.registeredAddress,
      mailingAddress: settings?.organizerSection?.mailingAddress?.trim()
        ? settings.organizerSection.mailingAddress
        : defaultOrganizer.mailingAddress,
      openingHours: settings?.organizerSection?.openingHours?.trim()
        ? settings.organizerSection.openingHours
        : defaultOrganizer.openingHours,
    },
    paymentMethodsNote:
      settings?.paymentMethodsNote?.trim() !== undefined &&
      settings.paymentMethodsNote.trim() !== ""
        ? settings.paymentMethodsNote
        : defaults.paymentMethodsNote ?? "",
  }
}

function docToSettings(doc: Record<string, unknown>, defaults: FooterSettings): FooterSettings {
  return normalize(doc as Partial<FooterSettings>, defaults)
}

async function persistFooter(key: string, settings: FooterSettings): Promise<void> {
  await FooterSetting.findOneAndUpdate({ key }, { $set: { key, ...settings } }, { upsert: true })
}

export class FooterSettingsService {
  /** Engine shop defaults (legacy global key). */
  static defaults() {
    return {
      ...ENGINE_SHOP_FOOTER_DEFAULTS,
      quickLinks: ENGINE_SHOP_FOOTER_DEFAULTS.quickLinks.map((item) => ({ ...item })),
      socialLinks: ENGINE_SHOP_FOOTER_DEFAULTS.socialLinks.map((item) => ({ ...item })),
    }
  }

  /**
   * Per-template footer row (`footer:<templateId>`).
   * Migrates customized legacy `footer` once; ignores shop/camp seed leftovers for WDF.
   */
  static async getForTemplate(template: TemplateModule): Promise<FooterSettings> {
    const templateId = template.manifest.id
    const key = footerKeyForTemplate(templateId)
    const defaults = resolveFooterDefaults(template)

    await dbConnect()
    const scoped = (await FooterSetting.findOne({ key }).lean()) as Record<string, unknown> | null
    if (scoped) {
      return docToSettings(scoped, defaults)
    }

    const legacy = (await FooterSetting.findOne({ key: LEGACY_FOOTER_KEY }).lean()) as Record<
      string,
      unknown
    > | null

    let seeded: FooterSettings
    if (legacy && shouldMigrateLegacyFooter(templateId, legacy as Partial<FooterSettings>)) {
      seeded = docToSettings(legacy, defaults)
    } else {
      seeded = normalize(undefined, defaults)
    }

    await persistFooter(key, seeded)
    return seeded
  }

  static async updateForTemplate(
    template: TemplateModule,
    input: Partial<FooterSettings>
  ): Promise<FooterSettings> {
    const current = await this.getForTemplate(template)
    const defaults = resolveFooterDefaults(template)
    const normalized = normalize({ ...current, ...input }, defaults)
    await dbConnect()
    await persistFooter(footerKeyForTemplate(template.manifest.id), normalized)
    return normalized
  }

  /** @deprecated Use getForTemplate with the active template module. */
  static async get(): Promise<FooterSettings> {
    await dbConnect()
    const doc = await FooterSetting.findOneAndUpdate(
      { key: LEGACY_FOOTER_KEY },
      { $setOnInsert: { key: LEGACY_FOOTER_KEY, ...this.defaults() } },
      { upsert: true, returnDocument: "after", lean: true }
    )
    return normalize(doc as Partial<FooterSettings>, this.defaults())
  }

  /** @deprecated Use updateForTemplate with the active template module. */
  static async update(input: Partial<FooterSettings>): Promise<FooterSettings> {
    await dbConnect()
    const merged = { ...(await this.get()), ...input }
    const normalized = normalize(merged, this.defaults())
    await FooterSetting.findOneAndUpdate(
      { key: LEGACY_FOOTER_KEY },
      { $set: normalized },
      { upsert: true }
    )
    return normalized
  }
}

import dbConnect from "@wse/core/lib/db"
import {
  ENGINE_SHOP_FOOTER_DEFAULTS,
  resolveFooterDefaults,
  shouldMigrateLegacyFooter,
} from "@wse/core/lib/resolve-footer-defaults"
import FooterSetting from "@wse/core/models/FooterSetting"
import type { TemplateModule } from "@wse/sdk/templates/types"
import { BASE_CONTENT_LOCALE } from "@wse/sdk/i18n/constants"

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
  /** Tax / VAT ID (adószám). */
  taxNumber?: string
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

export function footerKeyForTemplate(templateId: string, locale?: string): string {
  const base = `footer:${templateId}`
  return !locale || locale === BASE_CONTENT_LOCALE ? base : `${base}@${locale}`
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
    taxNumber: "",
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
      taxNumber: settings?.organizerSection?.taxNumber?.trim()
        ? settings.organizerSection.taxNumber
        : defaultOrganizer.taxNumber ?? "",
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

async function dropStaleSingletonIndex(): Promise<void> {
  try {
    const indexes = await FooterSetting.collection.indexes()
    if (indexes.some((idx) => idx.name === "singleton_1")) {
      await FooterSetting.collection.dropIndex("singleton_1")
    }
  } catch {
    // Index may already be gone or collection not ready — ignore.
  }
}

async function persistFooter(key: string, settings: FooterSettings): Promise<void> {
  try {
    await FooterSetting.findOneAndUpdate({ key }, { $set: { key, ...settings } }, { upsert: true })
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code
    const keyPattern = (err as { keyPattern?: Record<string, unknown> })?.keyPattern
    // Legacy unique index on `singleton` (pre key-scoped footers) blocks inserts when
    // multiple docs have singleton:null. Drop it and retry once.
    if (code === 11000 && keyPattern && "singleton" in keyPattern) {
      await dropStaleSingletonIndex()
      await FooterSetting.findOneAndUpdate({ key }, { $set: { key, ...settings } }, { upsert: true })
      return
    }
    // Concurrent upsert race on `key`: another request already inserted this row.
    if (code === 11000) {
      const existing = await FooterSetting.findOne({ key }).lean()
      if (existing) return
    }
    throw err
  }
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
   * Per-template footer row (`footer:<templateId>`, or `footer:<templateId>@<locale>` for a
   * non-base locale). Migrates customized legacy `footer` once (base locale only); ignores
   * shop/camp seed leftovers for WDF.
   */
  static async getForTemplate(template: TemplateModule, locale?: string): Promise<FooterSettings> {
    const templateId = template.manifest.id
    const key = footerKeyForTemplate(templateId, locale)
    const defaults = resolveFooterDefaults(template, locale)

    await dbConnect()
    const scoped = (await FooterSetting.findOne({ key }).lean()) as Record<string, unknown> | null
    if (scoped) {
      return docToSettings(scoped, defaults)
    }

    const isBaseLocale = !locale || locale === BASE_CONTENT_LOCALE
    const legacy = isBaseLocale
      ? ((await FooterSetting.findOne({ key: LEGACY_FOOTER_KEY }).lean()) as Record<
          string,
          unknown
        > | null)
      : null

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
    input: Partial<FooterSettings>,
    locale?: string
  ): Promise<FooterSettings> {
    const current = await this.getForTemplate(template, locale)
    const defaults = resolveFooterDefaults(template, locale)
    const normalized = normalize({ ...current, ...input }, defaults)
    await dbConnect()
    await persistFooter(footerKeyForTemplate(template.manifest.id, locale), normalized)
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

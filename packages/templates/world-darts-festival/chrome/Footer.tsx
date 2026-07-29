"use client"

import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { Button } from "@wse/core/components/ui/button"
import { mediaImageSrc } from "@wse/core/lib/images"
import { hasContactFieldValue } from "@wse/core/lib/contact-display"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"
import type {
  FooterSettings,
  FooterContactEntry,
  FooterOrganizerSection,
} from "@wse/core/services/footer-settings"
import type { ChromeProps, SiteContactEntry } from "@wse/sdk/templates/types"
import { localizeHref } from "@wse/sdk/i18n/constants"
import { resolveCmsHref } from "@wse/core/lib/cms-href"

const WDF_DEFAULT_QUICK_LINKS_BY_LOCALE: Record<string, ReadonlyArray<{ label: string; href: string }>> = {
  en: [
    { label: "Entries & booking", href: "/jegyek" },
    { label: "Venue", href: "/#venue" },
    { label: "Prize money", href: "/#prize-money" },
    { label: "Contact", href: "/#contact" },
  ],
  hu: [
    { label: "Nevezés és foglalás", href: "/jegyek" },
    { label: "Helyszín", href: "/#venue" },
    { label: "Díjazás", href: "/#prize-money" },
    { label: "Kapcsolat", href: "/#contact" },
  ],
}

const FOOTER_STRINGS: Record<string, {
  contact: string
  quickLinks: string
  organizer: string
  company: string
  taxNumber: string
  registeredAddress: string
  mailingAddress: string
  openingHours: string
  copyright: string
}> = {
  en: {
    contact: "Contact",
    quickLinks: "Quick links",
    organizer: "Organizer",
    company: "Company",
    taxNumber: "Tax number",
    registeredAddress: "Registered address",
    mailingAddress: "Mailing address",
    openingHours: "Opening hours",
    copyright: "© {year} {brand}. All rights reserved.",
  },
  hu: {
    contact: "Kapcsolat",
    quickLinks: "Gyors linkek",
    organizer: "Szervező",
    company: "Cég",
    taxNumber: "Adószám",
    registeredAddress: "Székhely",
    mailingAddress: "Levelezési cím",
    openingHours: "Nyitvatartás",
    copyright: "© {year} {brand}. Minden jog fenntartva.",
  },
}

const SHOP_DEFAULT_HREFS = new Set(["#home", "#about", "#shop", "#reviews", "#contact"])

function resolveQuickLinks(settings: FooterSettings | undefined, locale: string) {
  const links = settings?.quickLinks ?? []
  const looksLikeShopDefaults =
    links.length > 0 && links.every((item) => SHOP_DEFAULT_HREFS.has(item.href))
  if (!links.length || looksLikeShopDefaults) {
    const fallback = WDF_DEFAULT_QUICK_LINKS_BY_LOCALE[locale] ?? WDF_DEFAULT_QUICK_LINKS_BY_LOCALE.en
    return fallback.map((item) => ({ ...item }))
  }
  return links.filter((item) => item.label.trim())
}

type FooterProps = ChromeProps & {
  email?: string
  contactEmails?: SiteContactEntry[]
  phone?: string
  address?: string
  footerSettings?: FooterSettings
  legalLinks?: Array<{ key: string; title: string; href: string }>
  cmsEditable?: boolean
  onSettingsChange?: (next: FooterSettings) => void | Promise<void>
}

const controlClass =
  "cms-admin-control w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"

function contactEntryHref(entry: FooterContactEntry): string | null {
  const value = entry.value.trim()
  if (!value) return null
  switch (entry.kind) {
    case "mailto":
      return `mailto:${value}`
    case "tel":
      return `tel:${value.replace(/\s+/g, "")}`
    case "link":
      return value
    default:
      return null
  }
}

function ContactEntryRow({ entry }: { entry: FooterContactEntry }) {
  const href = contactEntryHref(entry)
  const label = entry.label.trim()
  const value = entry.value.trim()
  if (!value) return null

  const content = (
    <>
      {label ? <span className="text-foreground/80">{label}: </span> : null}
      {value}
    </>
  )

  if (href) {
    return (
      <a href={href} className="block text-muted-foreground hover:text-primary">
        {content}
      </a>
    )
  }

  return <p className="text-muted-foreground">{content}</p>
}

export function Footer({
  brandName,
  logoSrc,
  email,
  contactEmails = [],
  phone,
  address,
  footerSettings,
  legalLinks,
  cmsEditable = false,
  onSettingsChange,
  locale = "en",
}: FooterProps) {
  const strings = FOOTER_STRINGS[locale] ?? FOOTER_STRINGS.en
  const quickLinks = resolveQuickLinks(footerSettings, locale)
  const contactEntries = (footerSettings?.contactEntries ?? []).filter(
    (entry) => entry.value.trim()
  )
  const useContactEntries = contactEntries.length > 0
  const socialIconMap = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
  } as const
  const enabledSocialLinks = (footerSettings?.socialLinks ?? []).filter(
    (item) => item.enabled && item.url?.trim()
  )

  const copyrightText = (footerSettings?.copyrightText?.trim() || strings.copyright)
    .replaceAll("{year}", String(new Date().getFullYear()))
    .replaceAll("{brand}", brandName)

  const organizer: FooterOrganizerSection = footerSettings?.organizerSection ?? {
    title: "",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours: "",
    taxNumber: "",
  }
  const hasOrganizer =
    Boolean(organizer.companyName?.trim()) ||
    Boolean(organizer.registeredAddress?.trim()) ||
    Boolean(organizer.mailingAddress?.trim()) ||
    Boolean(organizer.openingHours?.trim()) ||
    Boolean(organizer.taxNumber?.trim()) ||
    Boolean(organizer.title?.trim())

  const patchSettings = (patch: Partial<FooterSettings>) => {
    if (!cmsEditable || !onSettingsChange) return
    void onSettingsChange({
      tagline: footerSettings?.tagline ?? "",
      quickLinksTitle: footerSettings?.quickLinksTitle ?? "",
      quickLinks: footerSettings?.quickLinks ?? [],
      categoriesTitle: footerSettings?.categoriesTitle ?? "",
      browseProductsLabel: footerSettings?.browseProductsLabel ?? "",
      contactTitle: footerSettings?.contactTitle ?? "",
      newsletterLabel: footerSettings?.newsletterLabel ?? "",
      newsletterPlaceholder: footerSettings?.newsletterPlaceholder ?? "",
      copyrightText: footerSettings?.copyrightText ?? "",
      socialLinks: footerSettings?.socialLinks ?? [],
      contactEntries: footerSettings?.contactEntries ?? [],
      organizerSection: footerSettings?.organizerSection ?? organizer,
      paymentMethodsNote: footerSettings?.paymentMethodsNote ?? "",
      ...patch,
    })
  }

  const contactTitle = footerSettings?.contactTitle?.trim() || strings.contact
  const quickLinksTitle = footerSettings?.quickLinksTitle?.trim() || strings.quickLinks

  return (
    <footer className="border-t border-border bg-surface text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            {logoSrc ? (
              <FallbackImage
                src={mediaImageSrc(logoSrc)}
                alt={brandName}
                width={140}
                height={44}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <p className="font-bold uppercase tracking-widest">{brandName}</p>
            )}
            {cmsEditable ? (
              <input
                value={footerSettings?.tagline ?? ""}
                onChange={(event) => patchSettings({ tagline: event.target.value })}
                className={controlClass}
                placeholder="Footer tagline"
              />
            ) : footerSettings?.tagline?.trim() ? (
              <p className="text-sm text-muted-foreground">{footerSettings.tagline}</p>
            ) : null}
            {enabledSocialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {enabledSocialLinks.map((item) => {
                  const Icon = socialIconMap[item.platform]
                  return (
                    <Link
                      key={item.platform}
                      href={item.url.trim()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex size-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                      aria-label={item.platform}
                    >
                      <Icon className="size-4" aria-hidden />
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-2 text-sm">
            {cmsEditable ? (
              <input
                value={footerSettings?.contactTitle ?? ""}
                onChange={(event) => patchSettings({ contactTitle: event.target.value })}
                className={controlClass}
                placeholder="Contact title"
              />
            ) : (
              <p className="font-semibold">{contactTitle}</p>
            )}
            {useContactEntries ? (
              <div className="space-y-1">
                {contactEntries.map((entry, index) => (
                  <ContactEntryRow key={`${entry.label}-${index}`} entry={entry} />
                ))}
              </div>
            ) : (
              <>
                {contactEmails.length > 0 ? (
                  <ul className="space-y-1">
                    {contactEmails.map((entry) => (
                      <li key={entry.id}>
                        <a
                          href={`mailto:${entry.email}`}
                          className="block text-muted-foreground hover:text-primary"
                        >
                          {entry.label ? (
                            <span>
                              <span className="text-foreground/80">{entry.label}: </span>
                              {entry.email}
                            </span>
                          ) : (
                            entry.email
                          )}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : hasContactFieldValue(email) ? (
                  <a
                    href={`mailto:${email}`}
                    className="block text-muted-foreground hover:text-primary"
                  >
                    {email}
                  </a>
                ) : null}
                {hasContactFieldValue(phone) ? (
                  <p className="text-muted-foreground">{phone}</p>
                ) : null}
                {hasContactFieldValue(address) ? (
                  <p className="text-muted-foreground">{address}</p>
                ) : null}
              </>
            )}
          </div>

          {hasOrganizer || cmsEditable ? (
            <div className="space-y-2 text-sm">
              {cmsEditable ? (
                <input
                  value={organizer.title}
                  onChange={(event) =>
                    patchSettings({
                      organizerSection: { ...organizer, title: event.target.value },
                    })
                  }
                  className={controlClass}
                  placeholder="Organizer title"
                />
              ) : organizer.title?.trim() ? (
                <p className="font-semibold">{organizer.title}</p>
              ) : (
                <p className="font-semibold">{strings.organizer}</p>
              )}
              {(
                [
                  ["companyName", "Company"],
                  ["taxNumber", "Tax number"],
                  ["registeredAddress", "Registered address"],
                  ["mailingAddress", "Mailing address"],
                  ["openingHours", "Opening hours"],
                ] as const
              ).map(([key, placeholder]) => {
                const value = organizer[key] ?? ""
                if (cmsEditable) {
                  return (
                    <input
                      key={key}
                      value={value}
                      onChange={(event) =>
                        patchSettings({
                          organizerSection: { ...organizer, [key]: event.target.value },
                        })
                      }
                      className={controlClass}
                      placeholder={placeholder}
                    />
                  )
                }
                if (!value.trim()) return null
                return (
                  <p key={key} className="text-muted-foreground">
                    {key === "taxNumber" ? (
                      <>
                        <span className="text-foreground/80">{strings.taxNumber}: </span>
                        {value}
                      </>
                    ) : (
                      value
                    )}
                  </p>
                )
              })}
            </div>
          ) : null}

          <div className="space-y-2 text-sm">
            {cmsEditable ? (
              <input
                value={footerSettings?.quickLinksTitle ?? ""}
                onChange={(event) => patchSettings({ quickLinksTitle: event.target.value })}
                className={controlClass}
                placeholder="Quick links title"
              />
            ) : (
              <p className="font-semibold">{quickLinksTitle}</p>
            )}
            <ul className="space-y-1">
              {quickLinks.map((item, index) => (
                <li key={`${item.href}-${index}`}>
                  {cmsEditable ? (
                    <div className="space-y-1">
                      <input
                        value={item.label}
                        onChange={(event) =>
                          patchSettings({
                            quickLinks: quickLinks.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, label: event.target.value } : row
                            ),
                          })
                        }
                        className={controlClass}
                        placeholder="Link text"
                      />
                      <input
                        value={item.href}
                        onChange={(event) =>
                          patchSettings({
                            quickLinks: quickLinks.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, href: event.target.value } : row
                            ),
                          })
                        }
                        className={controlClass}
                        placeholder="URL"
                      />
                    </div>
                  ) : (
                    (() => {
                      const resolved = resolveCmsHref(localizeHref(item.href, locale))
                      if (resolved.external) {
                        return (
                          <a
                            href={resolved.href}
                            className="block text-muted-foreground hover:text-primary"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.label}
                          </a>
                        )
                      }
                      return (
                        <Link
                          href={resolved.href}
                          className="block text-muted-foreground hover:text-primary"
                        >
                          {item.label}
                        </Link>
                      )
                    })()
                  )}
                </li>
              ))}
              {cmsEditable ? (
                <li>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="cms-admin-control"
                    onClick={() =>
                      patchSettings({
                        quickLinks: [...quickLinks, { label: "New link", href: "/" }],
                      })
                    }
                  >
                    Add link
                  </Button>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          {cmsEditable ? (
            <input
              value={footerSettings?.copyrightText ?? ""}
              onChange={(event) => patchSettings({ copyrightText: event.target.value })}
              className={`${controlClass} min-w-[240px] flex-1`}
              placeholder="© {year} {brand}"
            />
          ) : (
            <p>{copyrightText}</p>
          )}
          {legalLinks?.length ? (
            <FooterLegalLinks
              legalLinks={legalLinks}
              linkClassName="hover:text-primary"
              className="flex flex-wrap gap-4"
            />
          ) : null}
        </div>
      </div>
    </footer>
  )
}

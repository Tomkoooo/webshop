"use client"

import Link from "next/link"
import type { ChromeProps } from "@wse/sdk/templates/types"
import type { FooterOrganizerSection, FooterSettings } from "@wse/core/services/footer-settings"
import { ChromeAuthActions } from "./ChromeAuthActions"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"

type FooterProps = ChromeProps & {
  email?: string
  address?: string
  legalLinks?: Array<{ key: string; title: string; href: string }>
  footerSettings?: FooterSettings
  cmsEditable?: boolean
  onSettingsChange?: (next: FooterSettings) => void | Promise<void>
  /** Tábor helyszín — a Kapcsolat szekció cím mezőjéből */
  contactVenueAddress?: string
  onContactVenueChange?: (value: string) => void
  onContactEmailChange?: (value: string) => void
}

const DEFAULT_LINKS = [
  { title: "Gyakori kérdések", href: "/#faq" },
  { title: "Jegyvásárlás", href: "/jegyvasarlas" },
]

const controlClass =
  "cms-admin-control w-full bg-neutral-900/80 border border-dashed border-white/25 px-2 py-1 text-xs text-white font-sans"

const hintClass = "cms-admin-control mt-1 block text-[10px] leading-snug text-neutral-400"

function OrganizerLine({
  cmsEditable,
  value,
  onChange,
  placeholder,
}: {
  cmsEditable: boolean
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  if (!cmsEditable) {
    if (!value.trim()) return null
    return <p>{value}</p>
  }
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${controlClass} mt-1`}
      placeholder={placeholder}
    />
  )
}

export function Footer({
  brandName,
  logoSrc,
  email = "event@playit.hu",
  address,
  legalLinks = [],
  footerSettings,
  cmsEditable = false,
  onSettingsChange,
  contactVenueAddress,
  onContactVenueChange,
  onContactEmailChange,
}: FooterProps) {
  const venueLine = contactVenueAddress ?? address ?? ""
  const quickLinks =
    footerSettings?.quickLinks?.length && footerSettings.quickLinks.some((l) => l.label.trim())
      ? footerSettings.quickLinks
      : DEFAULT_LINKS.map((l) => ({ label: l.title, href: l.href }))

  const socialLinks = footerSettings?.socialLinks ?? []
  const facebook = socialLinks.find((l) => l.platform === "facebook")
  const instagram = socialLinks.find((l) => l.platform === "instagram")
  const facebookUrl = facebook?.enabled && facebook.url?.trim() ? facebook.url : null
  const instagramUrl = instagram?.enabled && instagram.url?.trim() ? instagram.url : null

  const organizer: FooterOrganizerSection = footerSettings?.organizerSection ?? {
    title: "A KockaKemp tábor szervezője az Eseményszervezés.hu BTL ügynökség Kft.",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours: "",
  }
  const paymentNote = footerSettings?.paymentMethodsNote ?? "Fizetés: bankkártya (Stripe)"

  const patchSettings = (patch: Partial<FooterSettings>) => {
    if (!footerSettings || !onSettingsChange) return
    void onSettingsChange({ ...footerSettings, ...patch })
  }

  const patchOrganizer = (patch: Partial<FooterOrganizerSection>) => {
    patchSettings({ organizerSection: { ...organizer, ...patch } })
  }

  const patchSocialUrl = (platform: "facebook" | "instagram", url: string) => {
    if (!footerSettings || !onSettingsChange) return
    const next = footerSettings.socialLinks.map((item) =>
      item.platform === platform ? { ...item, enabled: url.trim().length > 0, url } : item
    )
    void onSettingsChange({ ...footerSettings, socialLinks: next })
  }

  return (
    <footer className="bg-[#4e311f] border-t-4 border-[#2d1810] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={brandName}
              className="h-12 mx-auto object-contain pixelated mb-4"
            />
          ) : (
            <p className="font-minecraft text-sm text-[#78B7FF] mb-4">MINESHOW</p>
          )}
          <div className="flex justify-center gap-4">
            {cmsEditable ? (
              <div className="cms-admin-control flex flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex items-center gap-2 text-[10px] text-neutral-400">
                  Facebook
                  <input
                    defaultValue={facebook?.url ?? ""}
                    onBlur={(event) => patchSocialUrl("facebook", event.target.value)}
                    className={`${controlClass} max-w-xs`}
                    placeholder="https://facebook.com/…"
                  />
                </label>
                <label className="flex items-center gap-2 text-[10px] text-neutral-400">
                  Instagram
                  <input
                    defaultValue={instagram?.url ?? ""}
                    onBlur={(event) => patchSocialUrl("instagram", event.target.value)}
                    className={`${controlClass} max-w-xs`}
                    placeholder="https://instagram.com/…"
                  />
                </label>
              </div>
            ) : (
              <>
                {facebookUrl ? (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-minecraft-body text-xs underline"
                    aria-label="Facebook"
                  >
                    Facebook
                  </a>
                ) : null}
                {instagramUrl ? (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-minecraft-body text-xs underline"
                    aria-label="Instagram"
                  >
                    Instagram
                  </a>
                ) : null}
              </>
            )}
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3 font-minecraft-body text-xs text-white/90">
          <div>
            {cmsEditable ? (
              <input
                value={organizer.title}
                onChange={(event) => patchOrganizer({ title: event.target.value })}
                className={`${controlClass} mb-2 font-semibold`}
              />
            ) : (
              <p className="font-semibold mb-2">{organizer.title}</p>
            )}
            <OrganizerLine
              cmsEditable={cmsEditable}
              value={organizer.companyName}
              onChange={(value) => patchOrganizer({ companyName: value })}
              placeholder="Cégnév"
            />
            <OrganizerLine
              cmsEditable={cmsEditable}
              value={organizer.registeredAddress}
              onChange={(value) => patchOrganizer({ registeredAddress: value })}
              placeholder="Székhely"
            />
            <OrganizerLine
              cmsEditable={cmsEditable}
              value={organizer.mailingAddress}
              onChange={(value) => patchOrganizer({ mailingAddress: value })}
              placeholder="Levelezési cím"
            />
            <OrganizerLine
              cmsEditable={cmsEditable}
              value={organizer.openingHours}
              onChange={(value) => patchOrganizer({ openingHours: value })}
              placeholder="Nyitvatartás"
            />
            {venueLine || cmsEditable ? (
              cmsEditable && onContactVenueChange ? (
                <div className="mt-2">
                  <input
                    value={venueLine}
                    onChange={(event) => onContactVenueChange(event.target.value)}
                    className={controlClass}
                    placeholder="Tábor helyszín / cím"
                  />
                  <span className={hintClass}>
                    Ez a szöveg a{" "}
                    <a href="#contact" className="underline text-neutral-200">
                      Kapcsolat szekcióban
                    </a>{" "}
                    is megjelenik (cím mező).
                  </span>
                </div>
              ) : venueLine ? (
                <p className="mt-2">{venueLine}</p>
              ) : null
            ) : null}
          </div>
          <div>
            <p className="font-semibold mb-2">Hasznos linkek</p>
            <ul className="space-y-1">
              {quickLinks.map((link, index) => (
                <li key={`${link.href}-${index}`}>
                  {cmsEditable ? (
                    <div className="cms-admin-control space-y-1 mb-2">
                      <input
                        value={link.label}
                        onChange={(event) =>
                          patchSettings({
                            quickLinks: quickLinks.map((row, idx) =>
                              idx === index ? { ...row, label: event.target.value } : row
                            ),
                          })
                        }
                        className={controlClass}
                        placeholder="Link szöveg"
                      />
                      <input
                        value={link.href}
                        onChange={(event) =>
                          patchSettings({
                            quickLinks: quickLinks.map((row, idx) =>
                              idx === index ? { ...row, href: event.target.value } : row
                            ),
                          })
                        }
                        className={controlClass}
                        placeholder="/url"
                      />
                    </div>
                  ) : (
                    <Link href={link.href} className="hover:underline">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            {cmsEditable ? (
              <button
                type="button"
                className="cms-admin-control mt-2 border border-white/20 px-2 py-1 text-[10px] uppercase"
                onClick={() =>
                  patchSettings({
                    quickLinks: [...quickLinks, { label: "Új link", href: "/" }],
                  })
                }
              >
                + Link hozzáadása
              </button>
            ) : null}
          </div>
          <div>
            <p className="font-semibold mb-2">Kapcsolat</p>
            {cmsEditable ? (
              <div className="cms-admin-control space-y-2">
                <label className="block space-y-1">
                  <span className="text-[10px] text-neutral-400">Ügyfélszolgálat e-mail</span>
                  <input
                    value={email}
                    onChange={(event) => onContactEmailChange?.(event.target.value)}
                    className={controlClass}
                    placeholder="event@playit.hu"
                  />
                </label>
                <span className={hintClass}>
                  További címzettek és űrlap e-mailek:{" "}
                  <Link href="/admin/cms/settings?section=contact" className="underline text-neutral-200">
                    CMS → Weboldal beállítások → Kapcsolat e-mailek
                  </Link>
                  . A fenti cím a Kapcsolat szekció e-mail mezőjéből jön.
                </span>
              </div>
            ) : (
              <p>
                Ügyfélszolgálat:{" "}
                <a href={`mailto:${email}`} className="underline">
                  {email}
                </a>
              </p>
            )}
            {paymentNote || cmsEditable ? (
              cmsEditable ? (
                <div className="mt-4">
                  <input
                    value={paymentNote}
                    onChange={(event) => patchSettings({ paymentMethodsNote: event.target.value })}
                    className={`${controlClass} text-white/70`}
                    placeholder="Fizetés: bankkártya (Stripe)"
                  />
                  <span className={hintClass}>Csak azt írd ide, ami ténylegesen elérhető (pl. Stripe).</span>
                </div>
              ) : (
                <p className="mt-4 text-white/70">{paymentNote}</p>
              )
            ) : null}
            <p className="mt-3">
              <ChromeAuthActions variant="footer" />
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 bg-[#1a120c] px-4 py-4 space-y-3">
        <FooterLegalLinks
          legalLinks={legalLinks}
          linkClassName="font-minecraft-body text-[10px] text-white/60 hover:text-white hover:underline"
        />
        <p className="text-center font-minecraft-body text-[10px] text-white/50">
          powered by{" "}
          <a
            href="https://github.com/Tomkoooo/tWeb"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            tWeb
          </a>
        </p>
      </div>
    </footer>
  )
}

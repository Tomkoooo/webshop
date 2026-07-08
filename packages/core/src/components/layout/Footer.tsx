"use client"

import * as React from "react"
import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ChevronUp } from "lucide-react"
import { Button } from "@wse/core/components/ui/button"
import { Separator } from "@wse/core/components/ui/separator"
import { useSession, signIn } from "next-auth/react"
import { toast } from "sonner"
import type { FooterSettings } from "@wse/core/services/footer-settings"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"
import { hasContactFieldValue } from "@wse/core/lib/contact-display"
import type { ContactEmailEntry } from "@wse/core/lib/contact-emails"

type LegalLink = {
  key: string
  title: string
  href: string
}

interface FooterProps {
  brandName?: string
  logoSrc?: string
  email?: string
  contactEmails?: ContactEmailEntry[]
  phone?: string
  address?: string
  categories?: Array<{
    id: string
    name: string
    slug: string
    depth: number
  }>
  settings?: FooterSettings
  cmsEditable?: boolean
  onSettingsChange?: (next: FooterSettings) => void
  shopEnabled?: boolean
  /** SSR from cached feature flag — skips client fetch when set. */
  newsletterEnabled?: boolean
  /** SSR from cached legal docs — skips client fetch when set. */
  legalLinks?: LegalLink[]
}

export function Footer({
  brandName = "Generic Webshop",
  logoSrc = "/generic-logo.svg",
  email = "",
  contactEmails = [],
  phone = "",
  address = "",
  categories = [],
  settings,
  cmsEditable = false,
  onSettingsChange,
  shopEnabled = true,
  newsletterEnabled: newsletterEnabledProp,
  legalLinks: legalLinksProp,
}: FooterProps) {
  const resolvedBrand = { brandName, logoSrc }

  const socialIconMap = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    youtube: Youtube,
  } as const
  const enabledSocialLinks = (settings?.socialLinks || []).filter(
    (item) => item.enabled && item.url?.trim()
  )
  const quickLinks = settings?.quickLinks?.length
    ? settings.quickLinks
    : [
        { label: "Home", href: "#home" },
        { label: "About", href: "#about" },
        { label: "Products", href: "#shop" },
        { label: "Reviews", href: "#reviews" },
        { label: "Contact", href: "#contact" },
      ]
  const copyrightText = (settings?.copyrightText || "© {year} {brand}. ALL RIGHTS RESERVED.")
    .replaceAll("{year}", String(new Date().getFullYear()))
    .replaceAll("{brand}", resolvedBrand.brandName.toUpperCase())
  const patchSettings = (patch: Partial<FooterSettings>) => {
    if (!cmsEditable || !onSettingsChange) return
    onSettingsChange({
      tagline: settings?.tagline || "",
      quickLinksTitle: settings?.quickLinksTitle || "",
      quickLinks: settings?.quickLinks || [],
      categoriesTitle: settings?.categoriesTitle || "",
      browseProductsLabel: settings?.browseProductsLabel || "",
      contactTitle: settings?.contactTitle || "",
      newsletterLabel: settings?.newsletterLabel || "",
      newsletterPlaceholder: settings?.newsletterPlaceholder || "",
      copyrightText: settings?.copyrightText || "",
      socialLinks: settings?.socialLinks || [],
      ...patch,
    })
  }

  const { data: session } = useSession()
  const [newsletterEmail, setNewsletterEmail] = React.useState("")
  const [newsletterLoading, setNewsletterLoading] = React.useState(false)
  const [newsletterSubscribed, setNewsletterSubscribed] = React.useState(false)
  const [newsletterEnabledState, setNewsletterEnabledState] = React.useState(
    newsletterEnabledProp ?? false
  )
  const [legalLinksState, setLegalLinksState] = React.useState<LegalLink[]>(legalLinksProp ?? [])
  const newsletterEnabled = newsletterEnabledProp ?? newsletterEnabledState
  const legalLinks = legalLinksProp ?? legalLinksState

  React.useEffect(() => {
    if (session?.user?.email) {
      setNewsletterEmail(session.user.email)
    }
  }, [session?.user?.email])

  React.useEffect(() => {
    if (newsletterEnabledProp !== undefined) return
    const loadNewsletterFeature = async () => {
      try {
        const response = await fetch("/api/feature-flags/newsletter")
        if (!response.ok) return
        const data = await response.json()
        setNewsletterEnabledState(Boolean(data.enabled))
      } catch {
        setNewsletterEnabledState(false)
      }
    }
    loadNewsletterFeature()
  }, [newsletterEnabledProp])

  React.useEffect(() => {
    const loadSubscription = async () => {
      if (!newsletterEnabled) {
        setNewsletterSubscribed(false)
        return
      }
      if (!session?.user) {
        setNewsletterSubscribed(false)
        return
      }
      try {
        const response = await fetch("/api/user/profile")
        if (!response.ok) return
        const data = await response.json()
        setNewsletterSubscribed(Boolean(data.newsletterSubscribed))
      } catch {
        // no-op
      }
    }
    loadSubscription()
  }, [session?.user, newsletterEnabled])

  React.useEffect(() => {
    if (legalLinksProp !== undefined) return
    const loadLegalLinks = async () => {
      try {
        const response = await fetch("/api/legal-docs")
        if (!response.ok) return
        const data = await response.json()
        setLegalLinksState(data)
      } catch {
        // Silent fail in footer, links are optional until admin uploads docs
      }
    }
    loadLegalLinks()
  }, [legalLinksProp])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubscribe = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!session?.user) {
      signIn("google")
      return
    }

    setNewsletterLoading(true)
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        toast.error(data.error || "Nem sikerült a feliratkozás.")
        return
      }

      toast.success("Sikeres hírlevél feliratkozás.")
      setNewsletterSubscribed(true)
    } catch {
      toast.error("Hálózati hiba történt.")
    } finally {
      setNewsletterLoading(false)
    }
  }

  return (
    <footer className="bg-background-dark pt-24 pb-12 border-t border-border/40 relative overflow-hidden">
      {/* Subtle bottom glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1000px] h-[300px] bg-primary/5 blur-[150px] opacity-30 pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
          {/* Company Info */}
          <div className="space-y-10">
            <Link href="/" className="flex items-center gap-4 group">
              <div className="relative w-12 h-12">
                <FallbackImage
                  src={resolvedBrand.logoSrc}
                  alt={resolvedBrand.brandName}
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-heading font-black text-foreground tracking-[0.2em] uppercase">
                {resolvedBrand.brandName}
              </span>
            </Link>
            {cmsEditable ? (
              <input
                value={settings?.tagline || ""}
                onChange={(event) => patchSettings({ tagline: event.target.value })}
                className="w-full h-10 bg-surface border border-border px-2 text-foreground text-sm"
                placeholder="Tagline"
              />
            ) : (
              <p className="text-neutral-500 text-lg leading-relaxed">
                {settings?.tagline || "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore."}
              </p>
            )}
            <div className="flex gap-4">
              {enabledSocialLinks.map((item) => {
                const Icon = socialIconMap[item.platform]
                return (
                  <Link key={item.platform} href={item.url.trim()} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="w-12 h-12 rounded-none bg-muted/40 border border-border text-muted-foreground hover:text-primary-foreground hover:bg-muted/60 transition-all">
                      <Icon className="w-6 h-6" />
                    </Button>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-8">
            {cmsEditable ? (
              <input
                value={settings?.quickLinksTitle || ""}
                onChange={(event) => patchSettings({ quickLinksTitle: event.target.value })}
                className="w-full h-9 bg-surface border border-border px-2 text-foreground text-sm"
                placeholder="Quick links title"
              />
            ) : (
              <h3 className="text-foreground font-heading font-black text-xl uppercase tracking-widest">{settings?.quickLinksTitle || "Links"}</h3>
            )}
            <ul className="space-y-5">
              {quickLinks.map((item, index) => (
                <li key={`${item.label}-${index}`}>
                  {cmsEditable ? (
                    <div className="space-y-1">
                      <input
                        value={item.label}
                        onChange={(event) =>
                          patchSettings({
                            quickLinks: quickLinks.map((row, rowIndex) => (rowIndex === index ? { ...row, label: event.target.value } : row)),
                          })
                        }
                        className="w-full h-8 bg-surface border border-border px-2 text-foreground text-xs"
                      />
                      <input
                        value={item.href}
                        onChange={(event) =>
                          patchSettings({
                            quickLinks: quickLinks.map((row, rowIndex) => (rowIndex === index ? { ...row, href: event.target.value } : row)),
                          })
                        }
                        className="w-full h-8 bg-surface border border-border px-2 text-foreground text-xs"
                      />
                    </div>
                  ) : (
                    <Link href={item.href} className="text-muted-foreground hover:text-foreground transition-colors text-base font-bold uppercase tracking-widest">
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
              {cmsEditable ? (
                <li>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => patchSettings({ quickLinks: [...quickLinks, { label: "Új link", href: "#" }] })}
                  >
                    Link hozzáadása
                  </Button>
                </li>
              ) : null}
            </ul>
          </div>

          {/* Categories */}
          {shopEnabled ? (
            <div className="space-y-8">
              {cmsEditable ? (
                <input
                  value={settings?.categoriesTitle || ""}
                  onChange={(event) => patchSettings({ categoriesTitle: event.target.value })}
                  className="w-full h-9 bg-surface border border-border px-2 text-foreground text-sm"
                  placeholder="Categories title"
                />
              ) : (
                <h3 className="text-foreground font-heading font-black text-xl uppercase tracking-widest">
                  {settings?.categoriesTitle || "Categories"}
                </h3>
              )}
              <ul className="space-y-5">
                {categories.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/shop?category=${item.slug}`}
                      prefetch={false}
                      className="text-muted-foreground hover:text-foreground transition-colors text-base font-bold uppercase tracking-widest"
                    >
                      {item.depth > 0 ? `${"— ".repeat(item.depth)}${item.name}` : item.name}
                    </Link>
                  </li>
                ))}
                {categories.length === 0 ? (
                  <li>
                    <Link
                      href="/shop"
                      prefetch={false}
                      className="text-muted-foreground hover:text-foreground transition-colors text-base font-bold uppercase tracking-widest"
                    >
                      {settings?.browseProductsLabel || "Browse Products"}
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {/* Contact Info */}
          <div className="space-y-8">
            {cmsEditable ? (
              <input
                value={settings?.contactTitle || ""}
                onChange={(event) => patchSettings({ contactTitle: event.target.value })}
                className="w-full h-9 bg-surface border border-border px-2 text-foreground text-sm"
                placeholder="Contact title"
              />
            ) : (
              <h3 className="text-foreground font-heading font-black text-xl uppercase tracking-widest">{settings?.contactTitle || "Contact"}</h3>
            )}
            <ul className="space-y-6">
              {hasContactFieldValue(address) || cmsEditable ? (
                <li className="flex items-start gap-5 text-neutral-400">
                  <MapPin className="w-6 h-6 text-primary-foreground shrink-0" />
                  <span className="text-base font-medium">{address || (cmsEditable ? "—" : "")}</span>
                </li>
              ) : null}
              {hasContactFieldValue(phone) || cmsEditable ? (
                <li className="flex items-center gap-5 text-neutral-400">
                  <Phone className="w-6 h-6 text-primary-foreground shrink-0" />
                  <span className="text-base font-medium">{phone || (cmsEditable ? "—" : "")}</span>
                </li>
              ) : null}
              {contactEmails.length > 0 || hasContactFieldValue(email) || cmsEditable ? (
                <li className="flex items-start gap-5 text-neutral-400">
                  <Mail className="w-6 h-6 text-primary-foreground shrink-0 mt-0.5" />
                  {contactEmails.length > 1 ? (
                    <ul className="space-y-2 text-base font-medium">
                      {contactEmails.map((entry) => (
                        <li key={entry.id} className="uppercase tracking-tighter">
                          <span className="text-neutral-500 text-xs normal-case tracking-normal block mb-0.5">
                            {entry.label}
                          </span>
                          <a href={`mailto:${entry.email}`} className="hover:text-primary-foreground transition-colors">
                            {entry.email}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-base font-medium uppercase tracking-tighter">
                      {contactEmails[0]?.email || email || (cmsEditable ? "—" : "")}
                    </span>
                  )}
                </li>
              ) : null}
            </ul>

            {newsletterEnabled ? (
              <form onSubmit={handleSubscribe} className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">{settings?.newsletterLabel || "Newsletter"}</p>
                <input
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder={settings?.newsletterPlaceholder || "Your email"}
                  className="w-full h-11 bg-surface border border-border px-3 text-foreground text-sm focus:outline-none focus:border-primary-foreground/50"
                  disabled={Boolean(session?.user?.email)}
                />
                <Button
                  type="submit"
                  disabled={newsletterLoading || newsletterSubscribed}
                  className="w-full h-11 rounded-none bg-primary hover:bg-primary/85 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  {session?.user
                    ? newsletterSubscribed
                      ? "Already subscribed"
                      : "Subscribe to newsletter"
                    : "Sign in to subscribe"}
                </Button>
              </form>
            ) : null}
          </div>
        </div>

        <Separator className="bg-border mb-12" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <p className="text-neutral-600 text-sm font-bold tracking-widest text-center md:text-left">
            {copyrightText}
          </p>
          <FooterLegalLinks
            legalLinks={legalLinks}
            linkClassName="hover:text-foreground transition-colors"
            className="gap-8 text-xs font-black text-neutral-600 uppercase tracking-widest"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={scrollToTop}
            className="w-14 h-14 rounded-none bg-surface/40 border-border/40 text-primary-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-2xl"
          >
            <ChevronUp className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </footer>
  )
}

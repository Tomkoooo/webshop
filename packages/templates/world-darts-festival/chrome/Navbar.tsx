"use client"

import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, Menu, Ticket, X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import { LocaleLink } from "@wse/core/lib/locale-navigation"
import { defaultNavCta } from "@wse/plugin-t-book/lib/storefront-chrome"
import type { ChromeNavCta, ChromeNavItem, ChromeProps } from "@wse/sdk/templates/types"
import { localeSwitchPath, stripLocalePrefix } from "@wse/sdk/i18n/constants"
import { WdfTicker } from "./WdfTicker"

/** Locale-aware fallback for the ticket CTA when a route (e.g. static pages) has no CMS navCta. */
const DEFAULT_NAV_CTA_BY_LOCALE: Record<string, ChromeNavCta> = {
  en: defaultNavCta,
  hu: {
    enabled: true,
    label: "Nevezés",
    mobileLabel: "Nevezés és foglalás",
    href: "/jegyek",
    showIcon: true,
  },
}

const FALLBACK_NAV_BY_LOCALE: Record<string, ChromeNavItem[]> = {
  en: [
    { type: "link", label: "Home", href: "/" },
    { type: "link", label: "Entries", href: "/jegyek" },
    { type: "link", label: "Contact", href: "/#contact" },
  ],
  hu: [
    { type: "link", label: "Főoldal", href: "/" },
    { type: "link", label: "Nevezés", href: "/jegyek" },
    { type: "link", label: "Kapcsolat", href: "/#contact" },
  ],
}

const NAV_STRINGS: Record<string, {
  mainNav: string
  openMenu: string
  closeMenu: string
  mobileNav: string
}> = {
  en: { mainNav: "Main navigation", openMenu: "Open menu", closeMenu: "Close menu", mobileNav: "Mobile navigation" },
  hu: { mainNav: "Főmenü", openMenu: "Menü megnyitása", closeMenu: "Menü bezárása", mobileNav: "Mobil menü" },
}

/** Locales the WDF chrome supports; keep in sync with `manifest.locales` in `template.config.ts`. */
const WDF_SUPPORTED_LOCALES = ["en", "hu"] as const
const WDF_DEFAULT_LOCALE = "en"
const LOCALE_LABEL: Record<string, string> = { en: "EN", hu: "HU" }

function LanguageSwitcher({ locale, className }: { locale: string; className?: string }) {
  const switchTo = (toLocale: string) => {
    // Hard navigation only — soft Link + middleware rewrite share one App Router page and
    // stale RSC payloads. Target path always includes an explicit locale prefix (including
    // `/en/...` for the default) so middleware can sync `wse_locale` from the URL first.
    const pathname = window.location.pathname
    const search = window.location.search
    const targetPath = localeSwitchPath(pathname, toLocale, WDF_SUPPORTED_LOCALES, WDF_DEFAULT_LOCALE)
    const target = `${targetPath}${search}`
    if (pathname === targetPath) {
      window.location.reload()
      return
    }
    window.location.assign(target)
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs font-semibold", className)}>
      {WDF_SUPPORTED_LOCALES.map((loc, index) => (
        <span key={loc} className="flex items-center gap-1">
          {index > 0 ? <span className="text-foreground/40" aria-hidden>/</span> : null}
          {loc === locale ? (
            <span className="text-primary">{LOCALE_LABEL[loc]}</span>
          ) : (
            <button
              type="button"
              className="text-foreground/70 hover:text-primary"
              onClick={() => switchTo(loc)}
            >
              {LOCALE_LABEL[loc]}
            </button>
          )}
        </span>
      ))}
    </div>
  )
}

function NavDropdown({
  label,
  items,
  onNavigate,
  light,
}: {
  label: string
  items: ReadonlyArray<{ label: string; href: string }>
  onNavigate?: () => void
  light?: boolean
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={cn(
          "inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm font-medium hover:text-primary",
          light ? "text-foreground/90" : "text-foreground/90"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {label}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 pt-1">
          <div
            role="menu"
            className="min-w-[220px] rounded-lg border border-border bg-background py-2 shadow-xl"
          >
            {items.map((item) => (
              <LocaleLink
                key={`${item.href}-${item.label}`}
                href={item.href}
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  onNavigate?.()
                }}
                className="block min-h-11 px-4 py-2.5 text-sm text-foreground/90 hover:bg-muted hover:text-primary"
              >
                {item.label}
              </LocaleLink>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function MobileNavGroup({
  item,
  onNavigate,
}: {
  item: Extract<ChromeNavItem, { type: "dropdown" }>
  onNavigate: () => void
}) {
  const [open, setOpen] = useState(true)
  const panelId = useId()

  return (
    <div className="rounded-lg border border-border/60 bg-muted/20">
      <button
        type="button"
        id={`${panelId}-btn`}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        {item.label}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div id={panelId} role="group" aria-labelledby={`${panelId}-btn`} className="space-y-1 border-t border-border/60 px-2 pb-3 pt-1">
          {item.items.map((link) => (
            <LocaleLink
              key={`${link.href}-${link.label}`}
              href={link.href}
              onClick={onNavigate}
              className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-background hover:text-primary"
            >
              {link.label}
            </LocaleLink>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function NavCtaButton({
  cta,
  variant,
  className,
  cmsChromePreview,
  onNavigate,
}: {
  cta: ChromeNavCta
  variant: "desktop" | "mobile"
  className?: string
  cmsChromePreview?: boolean
  onNavigate?: () => void
}) {
  if (!cta.enabled) return null

  const label = cta.label.trim() || defaultNavCta.label
  const mobileLabel = cta.mobileLabel.trim() || label
  const href = cta.href.trim() || defaultNavCta.href
  const displayLabel = variant === "mobile" ? mobileLabel : label

  return (
    <LocaleLink
      href={href}
      onClick={onNavigate}
      className={cn(
        variant === "desktop"
          ? "inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          : "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground",
        cmsChromePreview && "pointer-events-none",
        className
      )}
    >
      {cta.showIcon ? <Ticket className="size-4" aria-hidden /> : null}
      {displayLabel}
    </LocaleLink>
  )
}

export function Navbar({
  brandName,
  logoSrc,
  shopEnabled: _shopEnabled = false,
  cmsChromePreview,
  navItems,
  navCta,
  tickerText = "",
  locale = "en",
}: ChromeProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [barHeight, setBarHeight] = useState(57)
  const barRef = useRef<HTMLDivElement>(null)
  const mobilePanelId = useId()
  const stripped = stripLocalePrefix(pathname, WDF_SUPPORTED_LOCALES)
  const basePath = stripped?.rest ?? pathname
  const isHome = basePath === "/"
  const items = navItems?.length ? navItems : FALLBACK_NAV_BY_LOCALE[locale] ?? FALLBACK_NAV_BY_LOCALE.en
  const cta = { ...(DEFAULT_NAV_CTA_BY_LOCALE[locale] ?? defaultNavCta), ...navCta }
  const strings = NAV_STRINGS[locale] ?? NAV_STRINGS.en

  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [mobileOpen])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close mobile nav on route change
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    const el = barRef.current
    if (!el || typeof ResizeObserver === "undefined") return
    const sync = () => setBarHeight(Math.round(el.getBoundingClientRect().height))
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [tickerText, cmsChromePreview])

  const navLinkClass = (href: string) =>
    cn(
      "inline-flex min-h-10 items-center rounded-md px-2 text-sm font-medium hover:text-primary",
      basePath === href ? "text-primary" : "text-foreground/90"
    )

  return (
    <>
      <header
        className={cn(
          "z-50 border-b backdrop-blur-md",
          cmsChromePreview ? "relative" : "fixed top-0 left-0 right-0",
          isHome && !cmsChromePreview
            ? "border-white/10 bg-black/40 text-foreground"
            : "border-border/60 bg-background/95"
        )}
      >
      <div ref={barRef}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <LocaleLink href="/" className="flex min-h-11 items-center gap-3" onClick={closeMobile}>
          {logoSrc ? (
            <FallbackImage
              src={mediaImageSrc(logoSrc)}
              alt={brandName}
              width={140}
              height={44}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-sm font-bold uppercase tracking-[0.15em]">{brandName}</span>
          )}
        </LocaleLink>

        <nav className="hidden items-center gap-1 lg:flex" aria-label={strings.mainNav}>
          {items.map((item) =>
            item.type === "dropdown" ? (
              <NavDropdown
                key={item.label}
                label={item.label}
                items={item.items}
                light={isHome && !cmsChromePreview}
              />
            ) : (
              <LocaleLink key={item.href} href={item.href} className={navLinkClass(item.href)}>
                {item.label}
              </LocaleLink>
            )
          )}
          <NavCtaButton cta={cta} variant="desktop" className="ml-2" cmsChromePreview={cmsChromePreview} />
          {!cmsChromePreview ? <LanguageSwitcher locale={locale} className="ml-2" /> : null}
        </nav>

        <button
          type="button"
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border p-2 lg:hidden",
            isHome && !cmsChromePreview ? "border-white/25 bg-black/20 text-foreground" : "border-border"
          )}
          aria-label={mobileOpen ? strings.closeMenu : strings.openMenu}
          aria-expanded={mobileOpen}
          aria-controls={mobilePanelId}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <WdfTicker text={tickerText} />
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label={strings.closeMenu}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            style={{ top: barHeight }}
            onClick={closeMobile}
          />
          <nav
            id={mobilePanelId}
            aria-label={strings.mobileNav}
            className="relative z-50 overflow-y-auto border-t border-border/60 bg-background px-4 py-4 text-foreground lg:hidden"
            style={{ maxHeight: `calc(100dvh - ${barHeight}px)` }}
          >
            <div className="flex flex-col gap-2">
              {items.map((item) =>
                item.type === "dropdown" ? (
                  <MobileNavGroup key={item.label} item={item} onNavigate={closeMobile} />
                ) : (
                  <LocaleLink
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </LocaleLink>
                )
              )}
              <NavCtaButton
                cta={cta}
                variant="mobile"
                className="mt-2"
                cmsChromePreview={cmsChromePreview}
                onNavigate={closeMobile}
              />
              <LanguageSwitcher locale={locale} className="mt-2 justify-center" />
            </div>
          </nav>
        </>
      ) : null}
    </header>
      {!cmsChromePreview ? <div style={{ height: barHeight }} aria-hidden /> : null}
    </>
  )
}

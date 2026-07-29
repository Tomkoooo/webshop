"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, Menu, Ticket, X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import { defaultNavCta } from "@wse/plugin-t-book/lib/storefront-chrome"
import type { ChromeNavCta, ChromeNavItem, ChromeProps } from "@wse/sdk/templates/types"
import { LOCALE_COOKIE, localizeHref } from "@wse/sdk/i18n/constants"

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
const LOCALE_LABEL: Record<string, string> = { en: "EN", hu: "HU" }

/** Swaps the leading `/<locale>` path segment (adding/removing it as needed) for the language switcher. */
function localeSwitchHref(pathname: string, fromLocale: string, toLocale: string): string {
  let rest = pathname
  for (const locale of WDF_SUPPORTED_LOCALES) {
    const prefix = `/${locale}`
    if (pathname === prefix) {
      rest = "/"
      break
    }
    if (pathname.startsWith(`${prefix}/`)) {
      rest = pathname.slice(prefix.length)
      break
    }
  }
  if (toLocale === "en") return rest
  return rest === "/" ? `/${toLocale}` : `/${toLocale}${rest}`
}

/** 1 year, matching the middleware's `wse_locale` cookie lifetime. */
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

function LanguageSwitcher({ locale, pathname, className }: { locale: string; pathname: string; className?: string }) {
  const switchTo = (toLocale: string) => {
    // A plain client-side <Link> soft-navigation here can end up reusing the previous
    // route's cached render (both "/" and "/hu" resolve to the same underlying page after
    // the middleware rewrite), leaving stale-language content under the new URL until a
    // second navigation. A hard navigation always re-runs the middleware and re-renders
    // from scratch, so the switch is correct on the first click. Setting the cookie here
    // (not just relying on the middleware) also means this explicit choice always wins,
    // even before the server has a chance to see it.
    document.cookie = `${LOCALE_COOKIE}=${toLocale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
    window.location.href = localeSwitchHref(pathname, locale, toLocale)
  }

  return (
    <div className={cn("flex items-center gap-1 text-xs font-semibold", className)}>
      {WDF_SUPPORTED_LOCALES.map((loc, index) => (
        <span key={loc} className="flex items-center gap-1">
          {index > 0 ? <span className="text-foreground/40" aria-hidden>/</span> : null}
          {loc === locale ? (
            <span className="text-primary">{LOCALE_LABEL[loc]}</span>
          ) : (
            <a
              href={localeSwitchHref(pathname, locale, loc)}
              className="text-foreground/70 hover:text-primary"
              onClick={(event) => {
                event.preventDefault()
                switchTo(loc)
              }}
            >
              {LOCALE_LABEL[loc]}
            </a>
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
              <Link
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
              </Link>
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
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              onClick={onNavigate}
              className="flex min-h-11 items-center rounded-md px-3 text-sm hover:bg-background hover:text-primary"
            >
              {link.label}
            </Link>
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
    <Link
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
    </Link>
  )
}

export function Navbar({
  brandName,
  logoSrc,
  shopEnabled = false,
  cmsChromePreview,
  navItems,
  navCta,
  locale = "en",
}: ChromeProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobilePanelId = useId()
  const isHome = pathname === "/"
  const rawItems = navItems?.length ? navItems : FALLBACK_NAV_BY_LOCALE[locale] ?? FALLBACK_NAV_BY_LOCALE.en
  const rawCta = { ...(DEFAULT_NAV_CTA_BY_LOCALE[locale] ?? defaultNavCta), ...navCta }
  const strings = NAV_STRINGS[locale] ?? NAV_STRINGS.en

  // Internal hrefs (nav items, CTA, "back to" links) are stored/authored without a locale
  // prefix — localize them at render time so browsing the Hungarian site doesn't silently
  // drop back to English on the next click.
  const items: ChromeNavItem[] = rawItems.map((item) =>
    item.type === "dropdown"
      ? { ...item, items: item.items.map((link) => ({ ...link, href: localizeHref(link.href, locale) })) }
      : { ...item, href: localizeHref(item.href, locale) }
  )
  const cta: ChromeNavCta = {
    ...rawCta,
    href: localizeHref(
      rawCta.href.trim() || (DEFAULT_NAV_CTA_BY_LOCALE[locale] ?? defaultNavCta).href,
      locale
    ),
  }

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

  const navLinkClass = (href: string) =>
    cn(
      "inline-flex min-h-10 items-center rounded-md px-2 text-sm font-medium hover:text-primary",
      pathname === href ? "text-primary" : isHome && !cmsChromePreview ? "text-foreground/90" : "text-foreground/90"
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
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={localizeHref("/", locale)} className="flex min-h-11 items-center gap-3" onClick={closeMobile}>
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
        </Link>

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
              <Link key={item.href} href={item.href} className={navLinkClass(item.href)}>
                {item.label}
              </Link>
            )
          )}
          <NavCtaButton cta={cta} variant="desktop" className="ml-2" cmsChromePreview={cmsChromePreview} />
          {!cmsChromePreview ? <LanguageSwitcher locale={locale} pathname={pathname} className="ml-2" /> : null}
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

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label={strings.closeMenu}
            className="fixed inset-0 top-[57px] z-40 bg-black/50 lg:hidden"
            onClick={closeMobile}
          />
          <nav
            id={mobilePanelId}
            aria-label={strings.mobileNav}
            className="relative z-50 max-h-[calc(100dvh-57px)] overflow-y-auto border-t border-border/60 bg-background px-4 py-4 text-foreground lg:hidden"
          >
            <div className="flex flex-col gap-2">
              {items.map((item) =>
                item.type === "dropdown" ? (
                  <MobileNavGroup key={item.label} item={item} onNavigate={closeMobile} />
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
                  >
                    {item.label}
                  </Link>
                )
              )}
              <NavCtaButton
                cta={cta}
                variant="mobile"
                className="mt-2"
                cmsChromePreview={cmsChromePreview}
                onNavigate={closeMobile}
              />
              <LanguageSwitcher locale={locale} pathname={pathname} className="mt-2 justify-center" />
            </div>
          </nav>
        </>
      ) : null}
    </header>
      {!cmsChromePreview ? <div className="h-[57px]" aria-hidden /> : null}
    </>
  )
}

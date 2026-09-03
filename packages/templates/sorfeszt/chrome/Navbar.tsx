"use client"

import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { Beer, ChevronDown, Menu, X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import { LocaleLink } from "@wse/core/lib/locale-navigation"
import { defaultNavCta } from "@wse/plugin-t-book/lib/storefront-chrome"
import type { ChromeNavCta, ChromeNavItem, ChromeProps } from "@wse/sdk/templates/types"
import { AgeGate } from "./AgeGate"

const FALLBACK_NAV: ChromeNavItem[] = [
  { type: "link", label: "Főoldal", href: "/" },
  { type: "link", label: "Helyszín", href: "/#helyszin" },
  { type: "link", label: "Jegyek", href: "/#jegyek" },
  { type: "link", label: "Programok", href: "/#programok" },
  { type: "link", label: "Galéria", href: "/#galeria" },
  { type: "link", label: "Házirend", href: "/hazirend" },
]

const DEFAULT_CTA: ChromeNavCta = {
  ...defaultNavCta,
  label: "Jegyek",
  mobileLabel: "Jegyvásárlás",
  href: "/jegyek",
  showIcon: true,
}

function NavDropdown({
  label,
  items,
  onNavigate,
}: {
  label: string
  items: ReadonlyArray<{ label: string; href: string }>
  onNavigate?: () => void
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
        className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-foreground/90 hover:text-primary"
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
        <div
          id={panelId}
          role="group"
          aria-labelledby={`${panelId}-btn`}
          className="space-y-1 border-t border-border/60 px-2 pb-3 pt-1"
        >
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
  const label = cta.label.trim() || DEFAULT_CTA.label
  const mobileLabel = cta.mobileLabel.trim() || label
  const href = cta.href.trim() || DEFAULT_CTA.href
  const displayLabel = variant === "mobile" ? mobileLabel : label

  return (
    <LocaleLink
      href={href}
      onClick={onNavigate}
      className={cn(
        variant === "desktop"
          ? "inline-flex min-h-10 items-center gap-1.5 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          : "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground",
        cmsChromePreview && "pointer-events-none",
        className
      )}
    >
      {cta.showIcon ? <Beer className="size-4" aria-hidden /> : null}
      {displayLabel}
    </LocaleLink>
  )
}

export function Navbar({
  brandName,
  logoSrc,
  cmsChromePreview,
  navItems,
  navCta,
}: ChromeProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobilePanelId = useId()
  const items = navItems?.length ? navItems : FALLBACK_NAV
  const cta = { ...DEFAULT_CTA, ...navCta }

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
      pathname === href ? "text-primary" : "text-foreground/90"
    )

  return (
    <>
      <AgeGate disabled={Boolean(cmsChromePreview)} />
      <header
        className={cn(
          "z-50 border-b border-border/70 bg-background/95 backdrop-blur-md",
          cmsChromePreview ? "relative" : "fixed top-0 left-0 right-0"
        )}
      >
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
              <span className="font-heading text-sm font-bold uppercase tracking-[0.15em]">
                {brandName || "Sörfeszt"}
              </span>
            )}
          </LocaleLink>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Főmenü">
            {items.map((item) =>
              item.type === "dropdown" ? (
                <NavDropdown key={item.label} label={item.label} items={item.items} />
              ) : (
                <LocaleLink key={item.href} href={item.href} className={navLinkClass(item.href)}>
                  {item.label}
                </LocaleLink>
              )
            )}
            <NavCtaButton cta={cta} variant="desktop" className="ml-2" cmsChromePreview={cmsChromePreview} />
          </nav>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border p-2 lg:hidden"
            aria-label={mobileOpen ? "Menü bezárása" : "Menü megnyitása"}
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
              aria-label="Menü bezárása"
              className="fixed inset-0 top-[57px] z-40 bg-foreground/40 lg:hidden"
              onClick={closeMobile}
            />
            <nav
              id={mobilePanelId}
              aria-label="Mobil menü"
              className="relative z-50 max-h-[calc(100dvh-57px)] overflow-y-auto border-t border-border/60 bg-background px-4 py-4 text-foreground lg:hidden"
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
              </div>
            </nav>
          </>
        ) : null}
      </header>
      {!cmsChromePreview ? <div className="h-[57px]" aria-hidden /> : null}
    </>
  )
}

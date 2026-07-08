"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useRef, useState } from "react"
import { ChevronDown, Menu, X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { PROJECT_LINKS, SERVICE_LINKS } from "../lib/constants"
import { ChromeAuthActions } from "./ChromeAuthActions"

const NAV_LINKS = [
  { label: "Főoldal", href: "/" },
  { label: "Rólunk", href: "/#about" },
  { label: "Ügyfeleink", href: "/#clients" },
  { label: "Galéria", href: "/#gallery" },
  { label: "Kapcsolat", href: "/#contact" },
] as const

function NavDropdown({
  label,
  items,
  onNavigate,
  light = false,
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
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
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
          "inline-flex min-h-10 items-center gap-1 rounded-md px-1 text-sm font-medium hover:text-primary",
          light ? "text-white/90" : "text-foreground/90"
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
            className="min-w-[240px] rounded-lg border border-border bg-background py-2 shadow-xl"
          >
            {items.map((item) => (
              <Link
                key={item.href}
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
  title,
  items,
  onNavigate,
}: {
  title: string
  items: ReadonlyArray<{ label: string; href: string }>
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
        {title}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div id={panelId} role="group" aria-labelledby={`${panelId}-btn`} className="space-y-1 border-t border-border/60 px-2 pb-3 pt-1">
          {items.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="flex min-h-11 items-center rounded-md px-3 text-sm text-foreground/90 hover:bg-background hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function Navbar({
  brandName,
  logoSrc,
  shopEnabled = false,
  cmsChromePreview,
}: ChromeProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobilePanelId = useId()
  const isHome = pathname === "/"

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
    setMobileOpen(false)
  }, [pathname])

  return (
    <header
      className={cn(
        "z-50 border-b backdrop-blur-md",
        cmsChromePreview ? "relative" : "sticky top-0",
        isHome && !cmsChromePreview
          ? "border-white/10 bg-black/35 text-white"
          : "border-border/60 bg-background/90"
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex min-h-11 items-center gap-3" onClick={closeMobile}>
          {logoSrc ? (
            <FallbackImage
              src={mediaImageSrc(logoSrc)}
              alt={brandName}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span className="text-sm font-bold uppercase tracking-[0.2em]">{brandName}</span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="Fő navigáció">
          {NAV_LINKS.slice(0, 1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-10 items-center text-sm font-medium hover:text-primary",
                pathname === link.href ? "text-primary" : isHome ? "text-white/90" : "text-foreground/90"
              )}
            >
              {link.label}
            </Link>
          ))}
          <NavDropdown label="Szolgáltatásaink" items={SERVICE_LINKS} light={isHome && !cmsChromePreview} />
          {NAV_LINKS.slice(1, 2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-10 items-center text-sm font-medium hover:text-primary",
                isHome ? "text-white/90" : "text-foreground/90"
              )}
            >
              {link.label}
            </Link>
          ))}
          <NavDropdown label="Projektjeink" items={PROJECT_LINKS} light={isHome && !cmsChromePreview} />
          {NAV_LINKS.slice(2).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex min-h-10 items-center text-sm font-medium hover:text-primary",
                isHome ? "text-white/90" : "text-foreground/90"
              )}
            >
              {link.label}
            </Link>
          ))}
          <ChromeAuthActions shopEnabled={shopEnabled} cmsChromePreview={cmsChromePreview} />
        </nav>

        <button
          type="button"
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border p-2 lg:hidden",
            isHome ? "border-white/25 bg-black/20 text-white" : "border-border"
          )}
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
            className="fixed inset-0 top-[57px] z-40 bg-black/50 lg:hidden"
            onClick={closeMobile}
          />
          <nav
            id={mobilePanelId}
            aria-label="Mobil navigáció"
            className="relative z-50 max-h-[calc(100dvh-57px)] overflow-y-auto border-t border-border/60 bg-background px-4 py-4 lg:hidden"
          >
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <MobileNavGroup title="Szolgáltatásaink" items={SERVICE_LINKS} onNavigate={closeMobile} />
              <MobileNavGroup title="Projektjeink" items={PROJECT_LINKS} onNavigate={closeMobile} />
              <div className="pt-2">
                <ChromeAuthActions shopEnabled={shopEnabled} cmsChromePreview={cmsChromePreview} />
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  )
}

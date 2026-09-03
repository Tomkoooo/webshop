"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useId, useState } from "react"
import { ChevronDown, Menu, X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { PROJECT_LINKS, SERVICE_LINKS } from "../lib/constants"
import { ServiceAtlas } from "../components/ServiceAtlas"
import { ChromeAuthActions } from "./ChromeAuthActions"
import "../sakkmed.css"

const NAV_LINKS = [
  { label: "Főoldal", href: "/" },
  { label: "Rólunk", href: "/#about" },
  { label: "Galéria", href: "/#gallery" },
  { label: "Kapcsolat", href: "/#contact" },
] as const

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
    <div className="rounded-xl border border-border/50 bg-muted/20">
      <button
        type="button"
        id={`${panelId}-btn`}
        aria-expanded={open}
        aria-controls={panelId}
        className="sakkmed-focus flex min-h-12 w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
        onClick={() => setOpen((v) => !v)}
      >
        {title}
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div id={panelId} role="group" aria-labelledby={`${panelId}-btn`} className="space-y-1 border-t border-border/50 px-2 pb-3 pt-1">
          {items.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              className="sakkmed-focus flex min-h-11 items-center rounded-md px-3 text-sm text-foreground/90 hover:bg-background hover:text-primary"
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
  const [atlasOpen, setAtlasOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mobilePanelId = useId()
  const isHome = pathname === "/"

  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const closeAtlas = useCallback(() => setAtlasOpen(false), [])

  useEffect(() => {
    if (cmsChromePreview) return
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [cmsChromePreview])

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
    setAtlasOpen(false)
  }, [pathname])

  return (
    <>
      <header
        className={cn(
          "sakkmed-root z-50",
          cmsChromePreview ? "relative px-3 pt-3" : "fixed left-0 right-0 top-0 px-3 pt-3 md:px-5"
        )}
      >
        <div
          className={cn(
            "sakkmed-glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full px-4 py-2.5 transition-[border-color,box-shadow,background] duration-300",
            scrolled && "border-primary/25 shadow-[0_8px_32px_rgba(0,0,0,0.45)]",
            isHome && !scrolled && !cmsChromePreview && "bg-black/25 border-foreground/10"
          )}
        >
          <Link href="/" className="sakkmed-focus flex min-h-11 items-center gap-3" onClick={closeMobile}>
            {logoSrc ? (
              <FallbackImage
                src={mediaImageSrc(logoSrc)}
                alt={brandName}
                width={120}
                height={40}
                className="h-9 w-auto object-contain"
              />
            ) : (
              <span className="sakkmed-display text-sm tracking-[0.12em] uppercase">{brandName}</span>
            )}
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Fő navigáció">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "sakkmed-focus inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary" : isHome && !scrolled ? "text-foreground/90" : "text-foreground/90"
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setAtlasOpen(true)}
              className={cn(
                "sakkmed-focus inline-flex min-h-10 items-center rounded-full border border-primary/40 bg-primary/10 px-4 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
              )}
            >
              Szolgáltatásaink
            </button>
            <ChromeAuthActions shopEnabled={shopEnabled} cmsChromePreview={cmsChromePreview} />
          </nav>

          <button
            type="button"
            className={cn(
              "sakkmed-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border p-2 lg:hidden",
              isHome && !scrolled ? "border-foreground/25 text-foreground" : "border-border"
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
              className="fixed inset-0 top-[72px] z-40 bg-black/55 lg:hidden"
              onClick={closeMobile}
            />
            <nav
              id={mobilePanelId}
              aria-label="Mobil navigáció"
              className="sakkmed-glass relative z-50 mx-auto mt-2 max-h-[calc(100dvh-88px)] max-w-6xl overflow-y-auto rounded-2xl px-4 py-4 lg:hidden"
            >
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobile}
                    className="sakkmed-focus flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
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

      <ServiceAtlas open={atlasOpen} onClose={closeAtlas} />
    </>
  )
}

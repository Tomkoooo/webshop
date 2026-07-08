"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { ArrowUpRight, Menu, X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { ERDWEG_BRAND, NAV_ANCHORS } from "../lib/constants"
import "../erdweg.css"

export function Navbar({
  brandName,
  logoSrc,
  cmsChromePreview,
}: ChromeProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobilePanelId = useId()
  const isHome = pathname === "/"
  const displayBrand = brandName || ERDWEG_BRAND

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

  return (
    <header
      className={cn(
        "z-50 border-b backdrop-blur-md",
        cmsChromePreview ? "relative" : "fixed inset-x-0 top-0",
        isHome && !cmsChromePreview
          ? "border-border/50 bg-background/70"
          : "border-border/60 bg-background/90"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
        <Link href="/#top" className="flex min-h-11 items-center gap-2" onClick={closeMobile}>
          {logoSrc ? (
            <FallbackImage
              src={mediaImageSrc(logoSrc)}
              alt={displayBrand}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <>
              <div className="grid h-7 w-7 place-items-center bg-primary font-[family-name:var(--font-display)] text-lg text-primary-foreground">
                {displayBrand.charAt(0).toUpperCase()}
              </div>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-wider">{displayBrand.toUpperCase()}</span>
            </>
          )}
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Fő navigáció">
          {NAV_ANCHORS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="erdweg-story-link text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/#contact"
          className="hidden items-center gap-2 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 md:inline-flex"
        >
          Projekt indítása <ArrowUpRight className="h-4 w-4" />
        </Link>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border p-2 md:hidden"
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
            className="fixed inset-0 top-16 z-40 bg-black/50 md:hidden"
            onClick={closeMobile}
          />
          <nav
            id={mobilePanelId}
            aria-label="Mobil navigáció"
            className="relative z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-border/60 bg-background px-6 py-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {NAV_ANCHORS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm font-medium hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/#contact"
                onClick={closeMobile}
                className="mt-2 inline-flex items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
              >
                Projekt indítása <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  )
}

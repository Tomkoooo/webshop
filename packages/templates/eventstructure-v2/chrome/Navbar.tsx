"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment, useCallback, useEffect, useId, useState } from "react"
import { Menu, X } from "lucide-react"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import { cn } from "@wse/core/lib/utils"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { Followspot } from "../components/Followspot"
import { ParallaxRoot } from "../components/ParallaxRoot"
import { ASSET, NAV_LINKS } from "../lib/constants"
import { ChromeAuthActions } from "./ChromeAuthActions"
import "../esv2.css"

export function Navbar({
  brandName,
  logoSrc: _logoSrc,
  shopEnabled = false,
  cmsChromePreview,
}: ChromeProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobilePanelId = useId()
  const closeMobile = useCallback(() => setMobileOpen(false), [])
  const mark = ASSET.logo

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
        "esv2-root sticky top-0 z-50 bg-background",
        !cmsChromePreview && "esv2-cursor-on",
        cmsChromePreview && "relative"
      )}
    >
      {!cmsChromePreview ? <Followspot /> : null}
      {!cmsChromePreview ? <ParallaxRoot /> : null}

      <div className="relative flex h-[4.25rem] items-center px-4 md:px-8">
        <Link href="/" className="esv2-focus relative z-10 flex items-center" onClick={closeMobile}>
          <FallbackImage
            src={mediaImageSrc(mark)}
            alt={brandName || "Event Structure"}
            width={48}
            height={48}
            quality={90}
            className="h-11 w-11 object-contain"
          />
        </Link>

        <nav className="esv2-nav absolute left-1/2 hidden -translate-x-1/2 md:flex" aria-label="Primary">
          {NAV_LINKS.map((link, idx) => (
            <Fragment key={link.href}>
              {idx > 0 ? <span className="esv2-nav-pipe" aria-hidden>|</span> : null}
              <Link
                href={link.href}
                className={cn(
                  "esv2-focus esv2-underline-draw",
                  pathname === link.href ? "text-foreground" : "text-foreground/80 hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            </Fragment>
          ))}
        </nav>

        <div className="relative z-10 ml-auto flex items-center gap-3">
          <div className="hidden md:block">
            <ChromeAuthActions shopEnabled={shopEnabled} cmsChromePreview={cmsChromePreview} />
          </div>
          <button
            type="button"
            className="esv2-focus inline-flex min-h-11 min-w-11 items-center justify-center md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls={mobilePanelId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 top-[4.25rem] z-40 bg-foreground/40 md:hidden"
            onClick={closeMobile}
          />
          <nav
            id={mobilePanelId}
            aria-label="Mobile"
            className="relative z-50 border-t border-border bg-background px-4 py-4 md:hidden"
          >
            <div className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  className="esv2-focus flex min-h-12 items-center border-b border-border text-base"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4">
                <ChromeAuthActions shopEnabled={shopEnabled} cmsChromePreview={cmsChromePreview} />
              </div>
            </div>
          </nav>
        </>
      ) : null}
    </header>
  )
}

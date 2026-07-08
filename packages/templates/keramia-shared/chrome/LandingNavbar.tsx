"use client"

import Link from "next/link"
import { useEffect, useId, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Menu, Phone, X } from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { KeramiaBrandLogo } from "../components/KeramiaBrandLogo"
import { KERAMIA_PHONE, KERAMIA_PHONE_HREF } from "../lib/constants"
import "../keramia.css"

const SECTION_LINKS = [
  { href: "#akcio", label: "Az akció" },
  { href: "#kezelesek", label: "Kezelések" },
  { href: "#kapcsolat", label: "Kapcsolat" },
] as const

export function LandingNavbar({ logoSrc, cmsChromePreview }: ChromeProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobilePanelId = useId()
  const contactHref = "/#kapcsolat"

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
        "keramia-chrome-header z-50 text-[#fffdf9]",
        cmsChromePreview ? "relative" : "fixed inset-x-0 top-0"
      )}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
        <KeramiaBrandLogo href="/" logoSrc={logoSrc} onClick={closeMobile} />

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Fő navigáció">
          {SECTION_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="keramia-display text-sm tracking-wider text-[#fffdf9]/90 transition-colors hover:text-primary"
            >
              {item.label}
            </a>
          ))}
          <a
            href={KERAMIA_PHONE_HREF}
            className="keramia-display hidden items-center gap-2 text-sm tracking-wide text-primary transition hover:text-[#fffdf9] xl:flex"
          >
            <Phone className="h-4 w-4" />
            {KERAMIA_PHONE}
          </a>
          <Link href={contactHref} className="keramia-btn-primary hidden px-5 py-3 sm:inline-flex">
            Kérek időpontot
          </Link>
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <Link href={contactHref} className="keramia-btn-primary hidden px-4 py-2.5 text-[10px] sm:inline-flex">
            Időpont
          </Link>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-primary hover:text-[#fffdf9]"
            aria-label={mobileOpen ? "Menü bezárása" : "Menü megnyitása"}
            aria-expanded={mobileOpen}
            aria-controls={mobilePanelId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
      {mobileOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Menü bezárása"
            className="fixed inset-0 top-20 z-40 bg-black/50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeMobile}
          />
          <motion.nav
            id={mobilePanelId}
            aria-label="Mobil navigáció"
            className="relative z-50 border-t border-primary/10 bg-[#120d0b] px-4 py-6 lg:hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex flex-col gap-1">
              {SECTION_LINKS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={closeMobile}
                  className="keramia-display min-h-11 rounded-md px-3 py-2 text-sm tracking-wider hover:bg-primary/10"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={KERAMIA_PHONE_HREF}
                className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-primary"
              >
                <Phone className="h-4 w-4" />
                {KERAMIA_PHONE}
              </a>
              <Link href={contactHref} onClick={closeMobile} className="keramia-btn-primary mt-4 w-full">
                Kérek időpontot
              </Link>
            </div>
          </motion.nav>
        </>
      ) : null}
      </AnimatePresence>
    </header>
  )
}

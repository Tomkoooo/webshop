"use client"

import Link from "next/link"
import { useEffect, useId, useState } from "react"
import { Menu, Phone, X } from "lucide-react"
import { cn } from "@wse/core/lib/utils"
import type { ChromeProps } from "@wse/sdk/templates/types"
import "../dr-zsanett.css"

const SECTION_LINKS = [
  { href: "#top", label: "Kezdőlap" },
  { href: "#bemutatkozas", label: "Bemutatkozás" },
  { href: "#szakteruletek", label: "Szakterületek" },
  { href: "#rolam", label: "Rólam mondták" },
  { href: "#kapcsolat", label: "Kapcsolat" },
] as const

/** Matches defaultContent.contact.phone — update both when the real number is set. */
const OFFICE_PHONE_TEL = "tel:+36300000000"

function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("dz-logo-mark h-10 w-10 text-sm", className)} aria-hidden>
      JS
    </span>
  )
}

export function Navbar({ brandName, cmsChromePreview }: ChromeProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const mobilePanelId = useId()
  const closeMobile = () => setMobileOpen(false)

  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener("keydown", onKey)
    }
  }, [mobileOpen])

  return (
    <header
      className={cn(
        "z-50 border-b border-border/80 bg-background/95 text-foreground backdrop-blur-sm",
        "font-[family-name:var(--dz-font-sans)]",
        cmsChromePreview ? "relative" : "sticky top-0"
      )}
    >
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between gap-4 px-4 lg:px-8">
        <Link
          href="/#top"
          className="flex items-center gap-3 text-foreground"
          onClick={closeMobile}
          aria-label={brandName || "Kezdőlap"}
        >
          <LogoMark />
          <span className="sr-only">{brandName || "Dr. Jámbrik Zsanett"}</span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Fő navigáció">
          {SECTION_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a href={OFFICE_PHONE_TEL} className="dz-btn-primary hidden gap-2 sm:inline-flex">
            <Phone className="h-3.5 w-3.5" aria-hidden />
            Időpontfoglalás
          </a>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-foreground lg:hidden"
            aria-label={mobileOpen ? "Menü bezárása" : "Menü megnyitása"}
            aria-expanded={mobileOpen}
            aria-controls={mobilePanelId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <nav
          id={mobilePanelId}
          aria-label="Mobil navigáció"
          className="border-t border-border bg-background px-4 py-4 lg:hidden"
        >
          <div className="flex flex-col gap-1">
            {SECTION_LINKS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className="min-h-11 px-2 py-2 text-sm uppercase tracking-[0.14em] text-foreground"
              >
                {item.label}
              </a>
            ))}
            <a
              href={OFFICE_PHONE_TEL}
              onClick={closeMobile}
              className="dz-btn-primary mt-3 w-full gap-2"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              Időpontfoglalás
            </a>
          </div>
        </nav>
      ) : null}
    </header>
  )
}

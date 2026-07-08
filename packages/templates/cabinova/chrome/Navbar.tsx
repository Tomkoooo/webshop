"use client"

import Link from "next/link"
import { RevealHeader } from "@wse/core/components/motion/css-reveal"
import { cn } from "@wse/core/lib/utils"
import "../cabinova.css"
import type { ChromeProps } from "@wse/sdk/templates/types"

const NAV = [
  { label: "Catalog", href: "/shop" },
  { label: "Studio", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const

export function Navbar({ brandName, logoSrc, shopEnabled }: ChromeProps) {
  return (
    <RevealHeader
      className={cn(
        "cabinova-root fixed top-0 left-0 right-0 z-50 border-b border-border/80 backdrop-blur-md bg-background/70"
      )}
    >
      <nav className="cabinova-page flex h-16 items-center justify-between">
        <Link href="/" className="font-[family-name:var(--font-display)] text-lg tracking-tight">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt={brandName} className="h-8 w-auto" />
          ) : (
            <>
              {brandName}
              <span className="text-accent">.</span>
            </>
          )}
        </Link>
        <div className="hidden md:flex items-center gap-10 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-accent transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
        {shopEnabled !== false ? (
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.2em] border border-foreground px-4 py-2.5 hover:bg-foreground hover:text-background transition-colors duration-300"
          >
            Catalog
          </Link>
        ) : null}
      </nav>
    </RevealHeader>
  )
}

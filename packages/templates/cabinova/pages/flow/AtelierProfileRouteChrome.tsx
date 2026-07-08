"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@wse/core/lib/utils"
import type { FlowProfileRouteChromeProps } from "@wse/sdk/templates/types"

const NAV = [
  { href: "/profile", label: "Adataid" },
  { href: "/profile/orders", label: "Rendelések" },
  { href: "/profile/feedback", label: "Visszajelzés" },
] as const

/** `flowPages.profile.RouteChrome` — **top tab rail** (not a left sidebar like many defaults). */
export function AtelierProfileRouteChrome({ children, shopEnabled: _shopEnabled }: FlowProfileRouteChromeProps) {
  void _shopEnabled
  const pathname = usePathname()

  return (
    <div className="min-h-0 bg-gradient-to-b from-muted/25 to-background px-4 pb-24 pt-36 md:px-8 md:pt-40">
      <div className="container mx-auto max-w-4xl">
        <h1 className="mb-8 font-serif text-3xl font-semibold tracking-tight md:text-4xl">Fiók</h1>

        <nav className="-mx-1 mb-10 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]" aria-label="Profil">
          {NAV.map(({ href, label }) => {
            const active = pathname === href || (href !== "/profile" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "shrink-0 rounded-full border px-5 py-2.5 font-serif text-xs font-semibold uppercase tracking-widest transition-colors",
                  active
                    ? "border-primary-foreground/35 bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:border-primary-foreground/40 hover:text-foreground"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="rounded-3xl border border-border bg-card/80 p-5 shadow-sm md:p-8">{children}</div>
      </div>
    </div>
  )
}

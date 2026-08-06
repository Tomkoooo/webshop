"use client"

import { cn } from "@wse/core/lib/utils"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { ChromeAuthActions } from "./ChromeAuthActions"
import "../dr-zsanett.css"

/** Dedicated firm name — do not use Mongo `brandName` (shared DBs often carry another shop’s branding). */
const FIRM_NAME = "Dr. Jámbrik Zsanett Ügyvédi Iroda"

export function Footer({
  legalLinks = [],
  cmsChromePreview,
}: ChromeProps & {
  legalLinks?: Array<{ key: string; title: string; href: string }>
}) {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-surface font-[family-name:var(--dz-font-sans)] text-surface-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-10 sm:flex-row sm:justify-between lg:px-8">
        <span className="dz-logo-mark h-9 w-9 text-xs" aria-hidden>
          JS
        </span>

        <p className="order-last text-center text-[0.7rem] tracking-wide text-muted-foreground sm:order-none">
          © {year} {FIRM_NAME} – Minden jog fenntartva.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <FooterLegalLinks
            legalLinks={legalLinks}
            linkClassName={cn(
              "text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
            )}
          />
          <ChromeAuthActions cmsChromePreview={cmsChromePreview} />
        </div>
      </div>
    </footer>
  )
}

"use client"

import Link from "next/link"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"
import { ERDWEG_BRAND, ERDWEG_TAGLINE } from "../lib/constants"
import { ChromeAuthActions } from "./ChromeAuthActions"
import "../erdweg.css"

export function Footer({
  brandName,
  email,
  phone,
  address,
  legalLinks = [],
  cmsChromePreview,
}: ChromeProps & {
  email?: string
  phone?: string
  address?: string
  legalLinks?: Array<{ key: string; title: string; href: string }>
}) {
  const displayBrand = brandName || ERDWEG_BRAND

  return (
    <footer className="border-t border-border bg-background px-6 py-10 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <div className="grid h-6 w-6 place-items-center bg-primary font-[family-name:var(--font-display)] text-sm text-primary-foreground">
            {displayBrand.charAt(0).toUpperCase()}
          </div>
          <span className="font-[family-name:var(--font-display)] tracking-wider">{displayBrand.toUpperCase()}</span>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">{ERDWEG_TAGLINE}</p>
        <div className="text-sm text-muted-foreground">
          {address ? <p>{address}</p> : null}
          {phone ? (
            <p className="mt-2">
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-primary">
                {phone}
              </a>
            </p>
          ) : null}
          {email ? (
            <p className="mt-2">
              <a href={`mailto:${email}`} className="text-primary hover:underline">
                {email}
              </a>
            </p>
          ) : null}
          <Link href="/#contact" className="mt-2 inline-block hover:text-primary">
            Kapcsolat
          </Link>
        </div>
      </div>
      <div className="relative mx-auto mt-8 max-w-7xl space-y-3 border-t border-border/40 pt-4">
        <FooterLegalLinks
          legalLinks={legalLinks}
          linkClassName="text-xs text-muted-foreground transition-colors hover:text-primary"
        />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {displayBrand}. Engedélyezett · Kötvény · Biztosított.
        </p>
        <span className="absolute bottom-1 right-0">
          <ChromeAuthActions cmsChromePreview={cmsChromePreview} />
        </span>
      </div>
    </footer>
  )
}

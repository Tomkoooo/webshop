"use client"

import Link from "next/link"
import { SAKKMED_FACEBOOK, SAKKMED_INSTAGRAM } from "../lib/constants"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"

export function Footer({
  brandName,
  email,
  phone,
  address,
  legalLinks = [],
}: ChromeProps & {
  email?: string
  phone?: string
  address?: string
  legalLinks?: Array<{ key: string; title: string; href: string }>
}) {
  return (
    <footer className="border-t border-border/60 bg-surface/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em]">{brandName}</p>
          <p className="mt-3 text-sm text-muted-foreground">
            A sikeres rendezvény kivitelezője — teljes körű rendezvénytechnika és műszaki háttér.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {address ? <p>{address}</p> : <p>1095 Budapest, Soroksári út 48.</p>}
          {phone ? <p className="mt-2">{phone}</p> : null}
          {email ? (
            <p className="mt-2">
              <a href={`mailto:${email}`} className="text-accent hover:underline">
                {email}
              </a>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <Link href="/#contact" className="hover:text-primary">
            Kapcsolat
          </Link>
          <a href={SAKKMED_FACEBOOK} target="_blank" rel="noreferrer" className="hover:text-primary">
            Facebook
          </a>
          <a href={SAKKMED_INSTAGRAM} target="_blank" rel="noreferrer" className="hover:text-primary">
            Instagram
          </a>
        </div>
      </div>
      <div className="border-t border-border/40 py-4 px-4 space-y-3">
        <FooterLegalLinks
          legalLinks={legalLinks}
          linkClassName="text-xs text-muted-foreground hover:text-primary transition-colors"
        />
        <p className="text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SAKKMED 2005 Kft.
        </p>
      </div>
    </footer>
  )
}

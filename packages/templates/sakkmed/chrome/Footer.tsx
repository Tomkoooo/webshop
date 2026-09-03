"use client"

import Link from "next/link"
import { SAKKMED_FACEBOOK, SAKKMED_INSTAGRAM } from "../lib/constants"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"
import "../sakkmed.css"

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
    <footer className="sakkmed-root relative overflow-hidden border-t border-border/40 bg-[var(--sm-deep,#070708)]">
      <p
        className="pointer-events-none absolute inset-x-0 bottom-0 select-none text-center sakkmed-display text-[18vw] leading-none text-foreground/5"
        aria-hidden
      >
        SAKKMED
      </p>
      <div className="sakkmed-page relative z-10 grid gap-10 py-16 md:grid-cols-[1.4fr_1fr_0.8fr] md:gap-12 md:py-20">
        <div>
          <p className="sakkmed-display text-lg tracking-[0.08em] uppercase">{brandName}</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--sm-body-muted,#C4C4CC)]">
            A sikeres rendezvény kivitelezője — teljes körű rendezvénytechnika és műszaki háttér.
          </p>
        </div>
        <div className="text-sm text-[var(--sm-body-muted,#C4C4CC)]">
          {address ? <p>{address}</p> : <p>1095 Budapest, Soroksári út 48.</p>}
          {phone ? <p className="mt-2">{phone}</p> : null}
          {email ? (
            <p className="mt-2">
              <a href={`mailto:${email}`} className="sakkmed-focus text-accent hover:underline">
                {email}
              </a>
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3 text-sm">
          <Link href="/#contact" className="sakkmed-focus hover:text-primary">
            Kapcsolat
          </Link>
          <a
            href={SAKKMED_FACEBOOK}
            target="_blank"
            rel="noreferrer"
            className="sakkmed-focus hover:text-primary"
          >
            Facebook
          </a>
          <a
            href={SAKKMED_INSTAGRAM}
            target="_blank"
            rel="noreferrer"
            className="sakkmed-focus hover:text-primary"
          >
            Instagram
          </a>
        </div>
      </div>
      <div className="relative z-10 border-t border-border/30 px-4 py-5 space-y-3">
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

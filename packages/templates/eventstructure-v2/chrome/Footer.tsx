"use client"

import {
  ES_ADDRESS_LINES,
  ES_EMAIL,
  ES_INSTAGRAM,
  ES_LINKEDIN,
  ES_PHONE,
} from "../lib/constants"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"
import "../esv2.css"

export function Footer({
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
  const addressBlock = address
    ? address.split(" · ").join("\n")
    : ES_ADDRESS_LINES.join("\n")

  return (
    <footer className="esv2-root esv2-cursor-on bg-foreground text-background">
      <div className="esv2-page grid gap-8 py-12 text-sm md:grid-cols-3 md:gap-10 md:py-16">
        <div className="whitespace-pre-line leading-relaxed">
          {addressBlock}
        </div>
        <div className="space-y-1 md:text-center">
          <p>{phone || ES_PHONE}</p>
          <p>
            <a href={`mailto:${email || ES_EMAIL}`} className="esv2-focus esv2-underline-draw">
              {email || ES_EMAIL}
            </a>
          </p>
        </div>
        <div className="md:text-right">
          <a href={ES_INSTAGRAM} target="_blank" rel="noreferrer" className="esv2-focus esv2-underline-draw">
            Instagram
          </a>
          <span className="px-2 opacity-50" aria-hidden>
            |
          </span>
          <a href={ES_LINKEDIN} target="_blank" rel="noreferrer" className="esv2-focus esv2-underline-draw">
            LinkedIn
          </a>
        </div>
      </div>
      <p className="esv2-wordmark px-2 text-center text-background" aria-hidden>
        EVENTSTRUCTURE
      </p>
      <div className="esv2-page space-y-2 pb-6 pt-4">
        <FooterLegalLinks
          legalLinks={legalLinks}
          linkClassName="text-[11px] text-background/70 hover:text-background transition-colors"
        />
      </div>
    </footer>
  )
}

"use client"

import { Clock, Mail, MapPin, Phone, Star } from "lucide-react"
import type { ChromeProps } from "@wse/sdk/templates/types"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"
import { KeramiaBrandLogo } from "../components/KeramiaBrandLogo"
import {
  KERAMIA_ADDRESS,
  KERAMIA_EMAIL,
  KERAMIA_PHONE,
  KERAMIA_PHONE_HREF,
} from "../lib/constants"
import { ChromeAuthActions } from "./ChromeAuthActions"
import "../keramia.css"

export function LandingFooter({
  logoSrc,
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
  const displayEmail = email || KERAMIA_EMAIL
  const displayPhone = phone || KERAMIA_PHONE
  const displayAddress = address || KERAMIA_ADDRESS

  return (
    <footer className="keramia-chrome-footer pt-16 pb-8">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 pb-12 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-5">
          <KeramiaBrandLogo href="/" logoSrc={logoSrc} light />
          <p className="mt-4 max-w-xs text-xs leading-relaxed text-[#fffdf9]/60">
            A Kerámia Dental minőségi, prémium szintű, fájdalommentes fogászatot és esztétikai
            kezeléseket biztosít Székesfehérvár szívében.
          </p>
          <div className="mt-3 flex gap-1 text-primary">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5 fill-primary" />
            ))}
          </div>
        </div>

        <div className="space-y-4 text-xs text-[#fffdf9]/70 lg:col-span-7">
          <p className="keramia-display text-xs font-bold uppercase tracking-widest text-primary">
            Kapcsolat
          </p>
          <p className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {displayAddress}
          </p>
          <a href={KERAMIA_PHONE_HREF} className="flex items-center gap-2.5 hover:text-primary">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            {displayPhone}
          </a>
          <a href={`mailto:${displayEmail}`} className="flex items-center gap-2.5 hover:text-primary">
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            {displayEmail}
          </a>
          <p className="flex items-start gap-2.5">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>
              Hétfő–Péntek: 08:00–20:00
              <br />
              Szombat: előzetes egyeztetés alapján
            </span>
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl border-t border-[#fffdf9]/10 px-4 pt-8 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <FooterLegalLinks
            legalLinks={legalLinks}
            linkClassName="text-[11px] tracking-wider text-[#fffdf9]/50 transition hover:text-primary"
          />
          <p className="text-[11px] tracking-wider text-[#fffdf9]/50">
            © {new Date().getFullYear()} Kerámia Dental
          </p>
          <ChromeAuthActions cmsChromePreview={cmsChromePreview} />
        </div>
      </div>
    </footer>
  )
}

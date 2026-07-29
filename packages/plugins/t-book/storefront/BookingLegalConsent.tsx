"use client"

import { useEffect, useState, type ReactNode } from "react"
import { tbookT } from "../lib/i18n"

export type LegalDocLink = {
  key: string
  title: string
  href: string
}

type Props = {
  accepted: boolean
  onAcceptedChange: (accepted: boolean) => void
  id?: string
  locale?: string
}

function DocLink({
  href,
  children,
}: {
  href: string | null
  children: ReactNode
}) {
  const linkClass =
    "font-medium text-primary underline underline-offset-2 hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-sm"
  if (href) {
    return (
      <a
        className={linkClass}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </a>
    )
  }
  return <strong className="font-medium">{children}</strong>
}

/**
 * Required consent before paying — links to site legal documents (ÁSZF / GDPR uploads).
 */
export function BookingLegalConsent({
  accepted,
  onAcceptedChange,
  id = "booking-legal-consent",
  locale,
}: Props) {
  const [termsHref, setTermsHref] = useState<string | null>(null)
  const [gdprHref, setGdprHref] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const res = await fetch("/api/legal-docs", { cache: "no-store" })
        if (!res.ok) return
        const data = (await res.json()) as LegalDocLink[]
        if (cancelled || !Array.isArray(data)) return
        const terms = data.find((d) => d.key === "terms")
        const gdpr = data.find((d) => d.key === "gdpr")
        if (terms?.href) setTermsHref(terms.href)
        if (gdpr?.href) setGdprHref(gdpr.href)
      } catch {
        // Optional until admin uploads docs in legal settings.
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 text-sm text-foreground"
    >
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-border"
        checked={accepted}
        onChange={(e) => onAcceptedChange(e.target.checked)}
        aria-required
      />
      <span>
        {tbookT(locale, "consentPrefix")}
        <DocLink href={termsHref}>{tbookT(locale, "termsAndConditions")}</DocLink>
        {tbookT(locale, "consentAnd")}
        <DocLink href={gdprHref}>{tbookT(locale, "privacyPolicyGdpr")}</DocLink>
        {tbookT(locale, "consentSuffix")}
        <strong className="font-medium">{tbookT(locale, "noRefundsAvailable")}</strong>
        {tbookT(locale, "consentEnd")}
      </span>
    </label>
  )
}

import Link from "next/link"
import { cn } from "@wse/core/lib/utils"

export type FooterLegalLink = {
  key: string
  title: string
  href: string
}

const LEGAL_KEY_ORDER = ["impresszum", "terms", "gdpr"] as const

export function sortFooterLegalLinks(links: FooterLegalLink[]): FooterLegalLink[] {
  return [...links].sort((a, b) => {
    const ai = LEGAL_KEY_ORDER.indexOf(a.key as (typeof LEGAL_KEY_ORDER)[number])
    const bi = LEGAL_KEY_ORDER.indexOf(b.key as (typeof LEGAL_KEY_ORDER)[number])
    const aRank = ai === -1 ? LEGAL_KEY_ORDER.length : ai
    const bRank = bi === -1 ? LEGAL_KEY_ORDER.length : bi
    return aRank - bRank
  })
}

type FooterLegalLinksProps = {
  legalLinks?: FooterLegalLink[]
  className?: string
  linkClassName?: string
}

/** Admin-uploaded legal PDFs (Impresszum, ÁSZF, GDPR) for template footers. */
export function FooterLegalLinks({
  legalLinks = [],
  className,
  linkClassName,
}: FooterLegalLinksProps) {
  const items = sortFooterLegalLinks(legalLinks.filter((link) => link.href?.trim()))
  if (items.length === 0) return null

  return (
    <nav className={cn("flex flex-wrap items-center justify-center gap-x-6 gap-y-2", className)} aria-label="Legal documents">
      {items.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClassName}
        >
          {link.title}
        </Link>
      ))}
    </nav>
  )
}

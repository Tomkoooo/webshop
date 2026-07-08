import Link from "next/link"
import "../cabinova.css"
import { ChromeAuthActions } from "./ChromeAuthActions"
import { FooterLegalLinks } from "@wse/core/templates/chrome/FooterLegalLinks"

type FooterProps = {
  brandName: string
  logoSrc?: string
  shopEnabled?: boolean
  cmsChromePreview?: boolean
  email?: string
  contactEmails?: Array<{ id: string; label: string; email: string }>
  phone?: string
  address?: string
  legalLinks?: Array<{ key: string; title: string; href: string }>
}

export function Footer({
  brandName,
  email,
  contactEmails,
  address,
  cmsChromePreview,
  legalLinks = [],
}: FooterProps) {
  const primaryEmail = contactEmails?.[0]?.email || email

  return (
    <footer className="cabinova-root border-t border-border bg-surface mt-32">
      <div className="cabinova-page py-20 grid md:grid-cols-4 gap-12">
        <div className="md:col-span-2">
          <h3 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl tracking-tight max-w-md">
            Begin with a site, a sketch, or simply an idea.
          </h3>
          {primaryEmail ? (
            <a
              href={`mailto:${primaryEmail}`}
              className="inline-block mt-8 text-accent underline underline-offset-8 decoration-1"
            >
              {primaryEmail}
            </a>
          ) : null}
        </div>
        <div className="text-sm space-y-3">
          <p className="cabinova-eyebrow mb-4">Studio</p>
          {address ? <p>{address}</p> : <p>Brussels, BE</p>}
        </div>
        <div className="text-sm space-y-3">
          <p className="cabinova-eyebrow mb-4">Explore</p>
          <Link href="/shop" className="block hover:text-accent">
            Catalog
          </Link>
          <Link href="/about" className="block hover:text-accent">
            Studio
          </Link>
          <Link href="/contact" className="block hover:text-accent">
            Contact
          </Link>
        </div>
      </div>
      <div className="relative border-t border-border py-6 px-4 space-y-4">
        <FooterLegalLinks
          legalLinks={legalLinks}
          linkClassName="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors"
        />
        <p className="text-center text-xs text-muted-foreground uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} {brandName}
        </p>
        <span className="absolute bottom-1 right-2">
          <ChromeAuthActions cmsChromePreview={cmsChromePreview} />
        </span>
      </div>
    </footer>
  )
}

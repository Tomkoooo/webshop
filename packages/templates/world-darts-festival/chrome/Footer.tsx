import Link from "next/link"
import { FallbackImage } from "@wse/core/components/common/FallbackImage"
import { mediaImageSrc } from "@wse/core/lib/images"
import type { ChromeProps } from "@wse/sdk/templates/types"

export function Footer({
  brandName,
  logoSrc,
  footerSettings,
  email,
  phone,
  address,
  legalLinks,
}: ChromeProps & {
  footerSettings?: { copyright?: string; tagline?: string }
  email?: string
  phone?: string
  address?: string
  legalLinks?: { key: string; title: string; href: string }[]
  categories?: unknown[]
  contactEmails?: unknown[]
  newsletterEnabled?: boolean
}) {
  const year = new Date().getFullYear()
  const copyright = footerSettings?.copyright?.trim() || `© ${year} ${brandName}`

  return (
    <footer className="border-t border-border bg-surface text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            {logoSrc ? (
              <FallbackImage
                src={mediaImageSrc(logoSrc)}
                alt={brandName}
                width={140}
                height={44}
                className="h-10 w-auto object-contain"
              />
            ) : (
              <p className="font-bold uppercase tracking-widest">{brandName}</p>
            )}
            {footerSettings?.tagline ? (
              <p className="text-sm text-muted-foreground">{footerSettings.tagline}</p>
            ) : null}
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Kapcsolat</p>
            {email ? (
              <a href={`mailto:${email}`} className="block text-muted-foreground hover:text-primary">
                {email}
              </a>
            ) : null}
            {phone ? <p className="text-muted-foreground">{phone}</p> : null}
            {address ? <p className="text-muted-foreground">{address}</p> : null}
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">Gyors linkek</p>
            <Link href="/jegyek" className="block text-muted-foreground hover:text-primary">
              Jegyek & foglalás
            </Link>
            <Link href="/#venue" className="block text-muted-foreground hover:text-primary">
              Helyszín
            </Link>
            <Link href="/#contact" className="block text-muted-foreground hover:text-primary">
              Kapcsolat
            </Link>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>{copyright}</p>
          {legalLinks?.length ? (
            <nav className="flex flex-wrap gap-4" aria-label="Jogi linkek">
              {legalLinks.map((link) => (
                <Link key={link.key || link.href} href={link.href} className="hover:text-primary">
                  {link.title}
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  )
}

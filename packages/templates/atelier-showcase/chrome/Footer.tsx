import { Footer as DefaultModernFooterImpl } from "@wse/core/components/layout/Footer"
import type { ChromeProps, SiteContactEntry } from "@wse/sdk/templates/types"
import type { FooterSettings } from "@wse/core/services/footer-settings"

type FooterChromeProps = ChromeProps & {
  email?: string
  contactEmails?: SiteContactEntry[]
  phone?: string
  address?: string
  categories?: Array<{ id: string; name: string; slug: string; depth: number }>
  footerSettings?: FooterSettings
}

export function Footer({
  brandName,
  logoSrc,
  shopEnabled = true,
  email,
  contactEmails = [],
  phone,
  address,
  categories,
  footerSettings,
  newsletterEnabled,
  legalLinks,
  cmsEditable,
  onSettingsChange,
}: FooterChromeProps & {
  newsletterEnabled?: boolean
  legalLinks?: Array<{ key: string; title: string; href: string }>
  cmsEditable?: boolean
  onSettingsChange?: (next: FooterSettings) => void | Promise<void>
}) {
  return (
    <DefaultModernFooterImpl
      brandName={brandName}
      logoSrc={logoSrc}
      shopEnabled={shopEnabled}
      email={email}
      contactEmails={contactEmails}
      phone={phone}
      address={address}
      categories={categories}
      settings={footerSettings}
      newsletterEnabled={newsletterEnabled}
      legalLinks={legalLinks}
      cmsEditable={cmsEditable}
      onSettingsChange={onSettingsChange}
    />
  )
}

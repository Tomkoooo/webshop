import { Suspense } from "react"
import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { getTBookSuccessContent } from "@wse/core/lib/tbook-page-content"
import { TBookSuccessClient } from "@wse/plugin-t-book/storefront/TBookSuccessClient"
import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"
import { tBookMainClassName } from "@wse/plugin-t-book/lib/tbook-page-shell"

export default async function FoglalasSikerPage() {
  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const siteConfig = await loadTBookStorefrontConfig(chrome.template.manifest.id)
  const successCopy = await getTBookSuccessContent(chrome.template.manifest.id)

  const [footerData, footerHydration] = await Promise.all([
    resolveStorefrontFooterContact(chrome.template),
    getStorefrontFooterHydrationProps(),
  ])
  const { branding, footerSettings, Navbar, Footer, NavbarSearch } = chrome
  const templateId = chrome.template.manifest.id

  return (
    <>
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={false}
        NavbarSearch={NavbarSearch}
        navItems={siteConfig?.navItems}
        navCta={siteConfig?.navCta}
      />
      <main className={tBookMainClassName(templateId)}>
        <Suspense
          fallback={
            <div className="text-center text-muted-foreground">{successCopy.loadingText}</div>
          }
        >
          <TBookSuccessClient
            copy={{
              loadingText: successCopy.loadingText,
              successTitle: successCopy.successTitle,
              successBody: successCopy.successBody,
              successCta: successCopy.successCta,
              errorBody: successCopy.errorBody,
              errorCta: successCopy.errorCta,
            }}
          />
        </Suspense>
      </main>
      <Footer
        brandName={branding.brandName}
        logoSrc={branding.logoFooter}
        shopEnabled={false}
        categories={footerData.categories}
        footerSettings={footerSettings}
        email={footerData.email}
        contactEmails={footerData.contactEmails}
        phone={footerData.phone}
        address={footerData.address}
        newsletterEnabled={footerHydration.newsletterEnabled}
        legalLinks={footerHydration.legalLinks}
      />
    </>
  )
}

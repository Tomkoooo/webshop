import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { getTBookListContent } from "@wse/core/lib/tbook-page-content"
import { TBookEventList } from "@wse/plugin-t-book/storefront/TBookEventList"
import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"

export default async function JegyekPage() {
  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const siteConfig = await loadTBookStorefrontConfig(chrome.template.manifest.id)
  const listCopy = await getTBookListContent(chrome.template.manifest.id)
  const apiKey = siteConfig?.tbookApiKey ?? ""

  const [footerData, footerHydration] = await Promise.all([
    resolveStorefrontFooterContact(chrome.template),
    getStorefrontFooterHydrationProps(),
  ])
  const { branding, footerSettings, Navbar, Footer, NavbarSearch } = chrome

  return (
    <>
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={false}
        NavbarSearch={NavbarSearch}
        navItems={siteConfig?.navItems}
      />
      <main className="min-h-[70vh] bg-background px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <TBookEventList
            apiKey={apiKey}
            copy={{
              pageTitle: listCopy.pageTitle,
              pageIntro: listCopy.pageIntro,
              emptyTitle: listCopy.emptyTitle,
              emptyBody: listCopy.emptyBody,
              bookCta: listCopy.bookCta,
              perPerson: listCopy.perPerson,
              perBooking: listCopy.perBooking,
            }}
          />
        </div>
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

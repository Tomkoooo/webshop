import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { getTBookListContent } from "@wse/core/lib/tbook-page-content"
import { TBookEventList } from "@wse/plugin-t-book/storefront/TBookEventList"
import { loadTBookStorefrontConfig } from "@wse/plugin-t-book/lib/load-storefront-config"
import { fetchPublicEventsForStorefront } from "@wse/plugin-t-book/lib/fetch-public-storefront"
import { resolveTBookServerApiBase } from "@wse/plugin-t-book/lib/tbook-api-base"
import { tBookListVariant, tBookMainClassName } from "@wse/plugin-t-book/lib/tbook-page-shell"

export default async function JegyekPage() {
  const enabled = await PluginService.isEnabled("t-book")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const siteConfig = await loadTBookStorefrontConfig(chrome.template.manifest.id)
  const listCopy = await getTBookListContent(chrome.template.manifest.id)
  const apiKey = siteConfig?.tbookApiKey ?? ""
  const apiBase = resolveTBookServerApiBase()
  const { events, currency, error: eventsError } = await fetchPublicEventsForStorefront(apiKey, apiBase)

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
        <div className="mx-auto max-w-5xl">
          <TBookEventList
            apiKey={apiKey}
            variant={tBookListVariant(templateId)}
            copy={{
              pageTitle: listCopy.pageTitle,
              pageIntro: listCopy.pageIntro,
              emptyTitle: listCopy.emptyTitle,
              emptyBody: listCopy.emptyBody,
              bookCta: listCopy.bookCta,
              perPerson: listCopy.perPerson,
              perBooking: listCopy.perBooking,
            }}
            initialEvents={events}
            initialError={eventsError}
            currency={currency}
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

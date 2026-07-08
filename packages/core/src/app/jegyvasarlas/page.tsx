import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { getActiveChrome } from "@wse/core/lib/active-chrome"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { CampList } from "@wse/plugin-camp-booking/storefront/CampList"
import { pressStart2P } from "@wse/template-minecraft-camp/fonts"
import { loadMineshowSiteConfig } from "@wse/template-minecraft-camp/lib/load-site-config"
import { getCampListContent } from "@wse/core/lib/camp-page-content"

export default async function JegyvasarlasPage() {
  const enabled = await PluginService.isEnabled("camp-booking")
  if (!enabled) notFound()

  const chrome = await getActiveChrome()
  const mineshowSite = await loadMineshowSiteConfig(chrome.template.manifest.id)
  const listCopy = await getCampListContent(chrome.template.manifest.id)
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
        venueBadge={mineshowSite?.venueShort}
      />
      <main className={`minecraft-page-mineshow min-h-[70vh] px-4 py-10 ${pressStart2P.variable}`}>
        <div className="max-w-4xl mx-auto">
          <h1 className="font-minecraft text-sm md:text-base text-[#2d2817] mb-2">
            {listCopy.pageTitle}
          </h1>
          <p className="font-minecraft-body text-sm text-[#5c4a32] mb-8">
            {listCopy.pageIntro}
          </p>
          <CampList variant="mineshow" />
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

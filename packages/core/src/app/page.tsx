import { getHomepagePageData } from "@wse/core/lib/homepage-page-data"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { extractMineshowSiteConfig } from "@wse/template-minecraft-camp/lib/site-config"
import { pressStart2P } from "@wse/template-minecraft-camp/fonts"
import { WDF_STOREFRONT_ROOT_CLASS } from "@wse/template-world-darts-festival/lib/wdf-classes"
import { extractTBookHomeChrome, navCtaFromTBookChrome, navItemsFromTBookChrome } from "@wse/plugin-t-book/lib/storefront-chrome"

export const revalidate = 60

export default async function LandingPage() {
  const [{ chrome, content, dependencies, footerData }, footerHydration] = await Promise.all([
    getHomepagePageData(),
    getStorefrontFooterHydrationProps(),
  ])

  const { template, branding, footerSettings, shopEnabled, locale, Navbar, Footer, NavbarSearch } = chrome
  const HomeRender = template.pages.home.Render
  const isMinecraftCamp = template.manifest.id === "minecraft-camp"
  const isWorldDartsFestival = template.manifest.id === "world-darts-festival"
  const mineshowSite = isMinecraftCamp ? extractMineshowSiteConfig(content) : null
  const wdfChrome = isWorldDartsFestival ? extractTBookHomeChrome(content) : null
  const wdfNavItems = wdfChrome ? navItemsFromTBookChrome(wdfChrome) : undefined
  const wdfNavCta = wdfChrome ? navCtaFromTBookChrome(wdfChrome) : undefined
  const fontRoot = isMinecraftCamp ? pressStart2P.variable : ""

  return (
    <div
      className={`flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-clip ${fontRoot} ${isWorldDartsFestival ? WDF_STOREFRONT_ROOT_CLASS : ""}`}
    >
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        NavbarSearch={NavbarSearch}
        venueBadge={mineshowSite?.venueShort}
        navItems={wdfNavItems}
        navCta={wdfNavCta}
        locale={locale}
      />

      <main className="overflow-x-clip">
        <HomeRender content={content} deps={dependencies} />
      </main>

      <Footer
        brandName={branding.brandName}
        logoSrc={branding.logoFooter}
        categories={footerData.categories}
        footerSettings={footerSettings}
        shopEnabled={shopEnabled}
        email={footerData.email}
        contactEmails={footerData.contactEmails}
        phone={footerData.phone}
        address={footerData.address}
        newsletterEnabled={footerHydration.newsletterEnabled}
        legalLinks={footerHydration.legalLinks}
        locale={locale}
      />
    </div>
  )
}

import { getHomepagePageData } from "@wse/core/lib/homepage-page-data"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { extractMineshowSiteConfig } from "@wse/template-minecraft-camp/lib/site-config"
import { pressStart2P } from "@wse/template-minecraft-camp/fonts"
import { extractTBookHomeChrome, navItemsFromTBookChrome } from "@wse/plugin-t-book/lib/storefront-chrome"

export const revalidate = 60

export default async function LandingPage() {
  const [{ chrome, content, dependencies, footerData }, footerHydration] = await Promise.all([
    getHomepagePageData(),
    getStorefrontFooterHydrationProps(),
  ])

  const { template, branding, footerSettings, shopEnabled, Navbar, Footer, NavbarSearch } = chrome
  const HomeRender = template.pages.home.Render
  const isMinecraftCamp = template.manifest.id === "minecraft-camp"
  const isWorldDartsFestival = template.manifest.id === "world-darts-festival"
  const mineshowSite = isMinecraftCamp ? extractMineshowSiteConfig(content) : null
  const wdfChrome = isWorldDartsFestival ? extractTBookHomeChrome(content) : null
  const wdfNavItems = wdfChrome ? navItemsFromTBookChrome(wdfChrome) : undefined
  const fontRoot = isMinecraftCamp ? pressStart2P.variable : ""

  return (
    <div
      className={`flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-hidden ${fontRoot}`}
    >
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        NavbarSearch={NavbarSearch}
        venueBadge={mineshowSite?.venueShort}
        navItems={wdfNavItems}
      />

      <main className="overflow-x-hidden">
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
      />
    </div>
  )
}

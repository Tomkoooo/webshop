import { getHomepagePageData } from "@wse/core/lib/homepage-page-data"
import { getStorefrontFooterHydrationProps } from "@wse/core/lib/storefront-footer-props"
import { extractMineshowSiteConfig } from "@wse/template-minecraft-camp/lib/site-config"
import { pressStart2P } from "@wse/template-minecraft-camp/fonts"
import { WDF_STOREFRONT_ROOT_CLASS } from "@wse/template-world-darts-festival/lib/wdf-classes"
import { SORFESZT_STOREFRONT_ROOT_CLASS } from "@wse/template-sorfeszt/lib/sorfeszt-classes"
import { extractTBookHomeChrome, navCtaFromTBookChrome, navItemsFromTBookChrome, tickerTextFromTBookChrome } from "@wse/plugin-t-book/lib/storefront-chrome"
import type { Metadata } from "next"
import { getStorefrontShopName, withStorefrontPageTitle } from "@wse/core/lib/storefront-page-title"

export const revalidate = 60

export async function generateMetadata(): Promise<Metadata> {
  try {
    const [{ content }, shopName] = await Promise.all([getHomepagePageData(), getStorefrontShopName()])
    const seoTitle = content.meta?.seoTitle?.trim()
    const seoDescription = content.meta?.seoDescription?.trim()
    const title = seoTitle
      ? seoTitle.includes("|")
        ? seoTitle
        : withStorefrontPageTitle(seoTitle, shopName)
      : undefined
    return {
      title,
      description: seoDescription || undefined,
      openGraph: {
        ...(title ? { title } : {}),
        ...(seoDescription ? { description: seoDescription } : {}),
        type: "website",
      },
      twitter: {
        ...(title ? { title } : {}),
        ...(seoDescription ? { description: seoDescription } : {}),
      },
    }
  } catch {
    return {}
  }
}

export default async function LandingPage() {
  const [{ chrome, content, dependencies, footerData }, footerHydration] = await Promise.all([
    getHomepagePageData(),
    getStorefrontFooterHydrationProps(),
  ])

  const { template, branding, footerSettings, shopEnabled, locale, Navbar, Footer, NavbarSearch } = chrome
  const HomeRender = template.pages.home.Render
  const isMinecraftCamp = template.manifest.id === "minecraft-camp"
  const usesTBookChrome = Boolean(template.tBookPages)
  const mineshowSite = isMinecraftCamp ? extractMineshowSiteConfig(content) : null
  const tbookChrome = usesTBookChrome ? extractTBookHomeChrome(content) : null
  const tbookNavItems = tbookChrome ? navItemsFromTBookChrome(tbookChrome) : undefined
  const tbookNavCta = tbookChrome ? navCtaFromTBookChrome(tbookChrome) : undefined
  const tbookTickerText = tbookChrome ? tickerTextFromTBookChrome(tbookChrome) : undefined
  const fontRoot = isMinecraftCamp ? pressStart2P.variable : ""
  const storefrontRootClass =
    template.manifest.id === "sorfeszt"
      ? SORFESZT_STOREFRONT_ROOT_CLASS
      : template.manifest.id === "world-darts-festival"
        ? WDF_STOREFRONT_ROOT_CLASS
        : ""

  return (
    <div
      className={`flex flex-col min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground overflow-x-clip ${fontRoot} ${storefrontRootClass}`}
    >
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        NavbarSearch={NavbarSearch}
        venueBadge={mineshowSite?.venueShort}
        navItems={tbookNavItems}
        navCta={tbookNavCta}
        tickerText={tbookTickerText}
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

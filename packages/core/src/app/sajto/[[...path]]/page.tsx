import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PluginService } from "@wse/core/services/plugin"
import { PressPortalClient } from "@wse/plugin-press-kit/storefront/PressPortalClient"
import { getPluginConfigForDeployment } from "@wse/core/config/deployments-registry"
import { getStorefrontChromeBundle } from "@wse/core/lib/storefront-chrome"
import { resolveStorefrontFooterContact } from "@wse/core/lib/storefront-footer-data"
import { STOREFRONT_MAIN_TOP_PADDING } from "@wse/core/lib/storefront-layout"
import { getPluginStorefrontSurface } from "@wse/core/lib/plugin-storefront-ui"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Sajtóanyagok",
}

type Props = { params: Promise<{ path?: string[] }> }

export default async function SajtoPage({ params }: Props) {
  const enabled = await PluginService.isEnabled("press-kit")
  if (!enabled) notFound()

  const { path = [] } = await params
  const tokenFromUrl = path[0]
  const host = await PluginService.getHost()
  const pluginConfig = getPluginConfigForDeployment("press-kit", host)
  const portalTitle = String(pluginConfig.portalTitle || "Sajtóanyagok")

  const {
    chrome: { template, branding, footerSettings, shopEnabled, Navbar, Footer, NavbarSearch },
    footerHydration,
  } = await getStorefrontChromeBundle()
  const footerData = await resolveStorefrontFooterContact(template)
  const surface = getPluginStorefrontSurface(template.manifest.id)

  return (
    <>
      <Navbar
        brandName={branding.brandName}
        logoSrc={branding.logoNav}
        shopEnabled={shopEnabled}
        NavbarSearch={NavbarSearch}
      />
      <main className={`${surface.pageMain} ${STOREFRONT_MAIN_TOP_PADDING} pb-20`}>
        <PressPortalClient
          tokenFromUrl={tokenFromUrl}
          portalTitle={portalTitle}
          templateId={template.manifest.id}
          brandName={branding.brandName}
        />
      </main>
      <Footer
        brandName={branding.brandName}
        logoSrc={branding.logoFooter}
        shopEnabled={shopEnabled}
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

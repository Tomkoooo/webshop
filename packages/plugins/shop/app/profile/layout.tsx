import type { Metadata } from "next"
import FlowPageTemplateBridge from "@wse/core/components/layout/FlowPageTemplateBridge"
import StorefrontFlowShell from "@wse/core/components/layout/StorefrontFlowShell"
import { ProfileChromeLayout } from "@wse/core/components/layout/ProfileChromeLayout"
import { TemplateService } from "@wse/core/services/template"
import { isShopEnabled } from "@wse/core/lib/features/shop"
import { getStorefrontShopName, withStorefrontPageTitle } from "@wse/core/lib/storefront-page-title"

export async function generateMetadata(): Promise<Metadata> {
  const shopName = await getStorefrontShopName()
  return {
    title: withStorefrontPageTitle("Profil", shopName),
    description: `${shopName} profiloldal és rendelések kezelése`,
  }
}

export default async function ProfileLayout({ children }: { children: React.ReactNode }) {
  const template = await TemplateService.getActive()
  const Chrome = template.flowPages?.profile?.RouteChrome ?? ProfileChromeLayout
  const shopEnabled = isShopEnabled()

  return (
    <StorefrontFlowShell>
      <FlowPageTemplateBridge route="profile">
        <Chrome shopEnabled={shopEnabled}>{children}</Chrome>
      </FlowPageTemplateBridge>
    </StorefrontFlowShell>
  )
}

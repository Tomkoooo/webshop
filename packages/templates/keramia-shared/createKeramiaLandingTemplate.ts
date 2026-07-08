import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { LandingFooter } from "./chrome/LandingFooter"
import { LandingNavbar } from "./chrome/LandingNavbar"
import { keramiaDentalTheme } from "./theme"
import { shopSchema } from "./pages/shop/schema"
import { shopDefaultContent } from "./pages/shop/defaultContent"
import { ShopRender } from "./pages/shop/Render"
import { pdpSchema } from "./pages/pdp/schema"
import { pdpDefaultContent } from "./pages/pdp/defaultContent"
import { PdpRender } from "./pages/pdp/Render"
import { campaignPageSchema, type CampaignPageContent } from "./static-pages/shared/schema"
import { CampaignHomeRender } from "./pages/CampaignHomeRender"

const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))
const CampaignHomeEditorPanel = dynamic(() =>
  import("./static-pages/shared/EditorPanel").then((m) => m.CampaignPageEditorPanel)
)

export type KeramiaLandingTemplateOptions = {
  id: string
  name: string
  description: string
  screenshot: string
  defaultContent: CampaignPageContent
}

/** Single-subdomain Kerámia campaign landing (home = full campaign page). */
export function createKeramiaLandingTemplate(
  options: KeramiaLandingTemplateOptions
): TemplateModule {
  return defineTemplate({
    manifest: {
      id: options.id,
      name: options.name,
      version: "1.0.0",
      author: "Webshop Engine",
      description: options.description,
      screenshots: [options.screenshot],
      capabilities: {
        hasBlog: false,
        staticPages: [],
        restyles: ["home"],
      },
      surfaces: DEFAULT_TEMPLATE_SURFACES,
      deployment: "landing",
    },
    defaultTheme: keramiaDentalTheme,
    chrome: {
      Navbar: LandingNavbar,
      Footer: LandingFooter,
    },
    pages: {
      home: {
        schema: campaignPageSchema,
        defaultContent: options.defaultContent,
        Render: CampaignHomeRender,
        EditorPanel: CampaignHomeEditorPanel,
      },
      shop: {
        schema: shopSchema,
        defaultContent: shopDefaultContent,
        Render: ShopRender,
        EditorPanel: ShopEditorPanel,
      },
      pdp: {
        schema: pdpSchema,
        defaultContent: pdpDefaultContent,
        Render: PdpRender,
        EditorPanel: PdpEditorPanel,
      },
    },
    staticPages: {},
  })
}

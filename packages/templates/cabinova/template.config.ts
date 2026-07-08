import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { cabinovaTheme } from "./theme"
import { Navbar } from "./chrome/Navbar"
import { Footer } from "./chrome/Footer"
import { CabinovaProductCard } from "./commerce/CabinovaProductCard"

import { homeSchema } from "./pages/home/schema"
import { homeDefaultContent } from "./pages/home/defaultContent"
import { HomeRender } from "./pages/home/Render"

import { shopSchema } from "./pages/shop/schema"
import { shopDefaultContent } from "./pages/shop/defaultContent"
import { ShopRender } from "./pages/shop/Render"

import { pdpSchema } from "./pages/pdp/schema"
import { pdpDefaultContent } from "./pages/pdp/defaultContent"
import { PdpRender } from "./pages/pdp/Render"

import { aboutSchema } from "./static-pages/about/schema"
import { aboutDefaultContent } from "./static-pages/about/defaultContent"
import { AboutRender } from "./static-pages/about/Render"

import { contactSchema } from "./static-pages/contact/schema"
import { contactDefaultContent } from "./static-pages/contact/defaultContent"
import { ContactRender } from "./static-pages/contact/Render"

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))
const AboutEditorPanel = dynamic(() =>
  import("./static-pages/about/EditorPanel").then((m) => m.AboutEditorPanel)
)
const ContactEditorPanel = dynamic(() =>
  import("./static-pages/contact/EditorPanel").then((m) => m.ContactEditorPanel)
)

export const cabinova: TemplateModule = defineTemplate({
  manifest: {
    id: "cabinova",
    name: "Cabinova",
    version: "1.0.0",
    author: "Webshop Engine",
    description:
      "Quiet Modernism house catalog — inquiry-only commerce, per-product visual PDP CMS, homepage blocks, and studio/contact pages.",
    screenshots: ["/template-previews/cabinova.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: ["about", "contact"],
      restyles: ["home", "shop", "pdp"],
      perProductPdpCms: true,
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "commerce",
  },
  defaultTheme: cabinovaTheme,
  commerceSlots: {
    ProductCard: CabinovaProductCard,
  },
  chrome: {
    Navbar,
    Footer,
  },
  pages: {
    home: {
      schema: homeSchema,
      defaultContent: homeDefaultContent,
      Render: HomeRender,
      EditorPanel: HomeEditorPanel,
      cmsPageKind: "homepage-blocks",
      allowedBlocks: ["hero", "about", "productGrid", "features", "contact"],
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
  staticPages: {
    about: {
      schema: aboutSchema,
      defaultContent: aboutDefaultContent,
      Render: AboutRender,
      EditorPanel: AboutEditorPanel,
    },
    contact: {
      schema: contactSchema,
      defaultContent: contactDefaultContent,
      Render: ContactRender,
      EditorPanel: ContactEditorPanel,
    },
  },
})

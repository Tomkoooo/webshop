import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@/templates/types"
import dynamic from "next/dynamic"
import { defaultModernTheme } from "./theme"
import { Navbar } from "./chrome/Navbar"
import { Footer } from "./chrome/Footer"

import { homeSchema } from "./pages/home/schema"
import { homeDefaultContent } from "./pages/home/defaultContent"
import { HomeRender } from "./pages/home/Render"

import { shopSchema } from "./pages/shop/schema"
import { shopDefaultContent } from "./pages/shop/defaultContent"
import { ShopRender } from "./pages/shop/Render"

import { pdpSchema } from "./pages/pdp/schema"
import { pdpDefaultContent } from "./pages/pdp/defaultContent"
import { PdpRender } from "./pages/pdp/Render"

import {
  DefaultModernCartFlowBody,
  DefaultModernFlowPageShell,
} from "./pages/flow/FlowWrappers"
import { defaultModernFlowShellSchema } from "./pages/flow/flow-shell-schema"
import { DefaultModernFlowBandShell } from "./pages/flow/FlowBandShell"
import { DefaultModernFlowShellEditorPanel } from "./pages/flow/FlowShellEditorPanel"

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))

export const defaultModern: TemplateModule = defineTemplate({
  manifest: {
    id: "default-modern",
    name: "Default Modern",
    version: "1.0.0",
    author: "Webshop Engine",
    description:
      "Polished dark-mode storefront with the visual block-based homepage editor. The starting point for every shop.",
    screenshots: ["/template-previews/default-modern.svg"],
    capabilities: {
      hasBlog: false,
      /** Add slugs here (with matching entries in `staticPages`) when your template owns extra routes — e.g. `about`. */
      staticPages: [],
      restyles: ["home", "shop", "pdp"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "commerce",
  },
  defaultTheme: defaultModernTheme,
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
      allowedBlocks: ["hero", "about", "videoCarousel", "testimonials", "gallery", "features", "productGrid", "contact"],
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
  flowPages: {
    cart: {
      Wrapper: DefaultModernFlowPageShell,
      Body: DefaultModernCartFlowBody,
      shell: {
        schema: defaultModernFlowShellSchema,
        defaultContent: { headline: "Kosár", subhead: "Rendelésed összegzése és módosítása." },
        Shell: DefaultModernFlowBandShell,
        EditorPanel: DefaultModernFlowShellEditorPanel,
      },
    },
    checkout: {
      Wrapper: DefaultModernFlowPageShell,
      shell: {
        schema: defaultModernFlowShellSchema,
        defaultContent: {
          headline: "Pénztár",
          subhead: "Biztonságos fizetés és szállítási adatok.",
        },
        Shell: DefaultModernFlowBandShell,
        EditorPanel: DefaultModernFlowShellEditorPanel,
      },
    },
    profile: {
      Wrapper: DefaultModernFlowPageShell,
      shell: {
        schema: defaultModernFlowShellSchema,
        defaultContent: { headline: "Fiókom", subhead: "Rendeléseid és beállításaid." },
        Shell: DefaultModernFlowBandShell,
        EditorPanel: DefaultModernFlowShellEditorPanel,
      },
    },
  },
})

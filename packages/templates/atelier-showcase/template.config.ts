import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { atelierShowcaseTheme } from "./theme"
import { Navbar } from "./chrome/Navbar"
import { Footer } from "./chrome/Footer"
import { AtelierProductCard } from "./commerce/AtelierProductCard"
import { AtelierCategoryPill } from "./commerce/AtelierCategoryPill"
import { AtelierNavbarSearch } from "./commerce/AtelierNavbarSearch"
import { AtelierProductDetailSlot } from "./commerce/AtelierProductDetailSlot"

import { homeSchema } from "./pages/home/schema"
import { homeDefaultContent } from "./pages/home/defaultContent"
import { HomeRender } from "./pages/home/Render"

import { shopSchema } from "./pages/shop/schema"
import { shopDefaultContent } from "./pages/shop/defaultContent"
import { ShopRender } from "./pages/shop/Render"

import { pdpSchema } from "./pages/pdp/schema"
import { pdpDefaultContent } from "./pages/pdp/defaultContent"
import { PdpRender } from "./pages/pdp/Render"

import { AtelierCartRouteMain } from "./pages/flow/AtelierCartRouteMain"
import { AtelierCheckoutRouteMain } from "./pages/flow/AtelierCheckoutRouteMain"
import { AtelierProfileRouteMain } from "./pages/flow/AtelierProfileRouteMain"
import { AtelierProfileRouteChrome } from "./pages/flow/AtelierProfileRouteChrome"

import { editorialSchema } from "./static-pages/editorial/schema"
import { editorialDefaultContent } from "./static-pages/editorial/defaultContent"
import { EditorialRender } from "./static-pages/editorial/Render"

import { journalSchema } from "./static-pages/journal/schema"
import { journalDefaultContent } from "./static-pages/journal/defaultContent"
import { JournalRender } from "./static-pages/journal/Render"

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))
const EditorialEditorPanel = dynamic(() =>
  import("./static-pages/editorial/EditorPanel").then((m) => m.EditorialEditorPanel)
)
const JournalEditorPanel = dynamic(() =>
  import("./static-pages/journal/EditorPanel").then((m) => m.JournalEditorPanel)
)

export const atelierShowcase: TemplateModule = defineTemplate({
  manifest: {
    id: "atelier-showcase",
    name: "Atelier Showcase",
    version: "1.0.0",
    author: "Webshop Engine",
    description:
      "Showcase: homepage blocks, full-bleed cart/checkout/profile via flowPageCompose routeOnly, custom shop/PDP commerce slots, CMS editorial + journal.",
    screenshots: ["/template-previews/atelier-showcase.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: ["editorial", "journal"],
      restyles: ["home", "shop", "pdp"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "commerce",
  },
  defaultTheme: atelierShowcaseTheme,
  commerceSlots: {
    ProductCard: AtelierProductCard,
    CategoryPill: AtelierCategoryPill,
    NavbarSearch: AtelierNavbarSearch,
    ProductDetail: AtelierProductDetailSlot,
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
      allowedBlocks: [
        "hero",
        "divider",
        "richText",
        "gallery",
        "about",
        "features",
        "productGrid",
        "testimonials",
        "cta",
        "contact",
      ],
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
    editorial: {
      schema: editorialSchema,
      defaultContent: editorialDefaultContent,
      Render: EditorialRender,
      EditorPanel: EditorialEditorPanel,
    },
    journal: {
      schema: journalSchema,
      defaultContent: journalDefaultContent,
      Render: JournalRender,
      EditorPanel: JournalEditorPanel,
    },
  },
  flowPages: {
    cart: {
      flowPageCompose: "routeOnly",
      RouteMain: AtelierCartRouteMain,
    },
    checkout: {
      flowPageCompose: "routeOnly",
      RouteMain: AtelierCheckoutRouteMain,
    },
    profile: {
      flowPageCompose: "routeOnly",
      RouteMain: AtelierProfileRouteMain,
      RouteChrome: AtelierProfileRouteChrome,
    },
  },
})

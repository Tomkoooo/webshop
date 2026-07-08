import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { minecraftCampTheme } from "./theme"
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
  campBookingContentSchema,
  campListContentSchema,
  campSuccessContentSchema,
} from "./pages/camp/schemas"
import {
  campBookingDefaultContent,
  campListDefaultContent,
  campSuccessDefaultContent,
} from "./pages/camp/defaultContent"
import { CampListRender } from "./pages/camp/jegyvasarlas/Render"
import { CampBookingRender } from "./pages/camp/foglalas/Render"
import { CampSuccessRender } from "./pages/camp/foglalas-siker/Render"
import { CampSurfaceEditorPanel } from "./pages/camp/EditorPanel"

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))

export const minecraftCamp: TemplateModule = defineTemplate({
  manifest: {
    id: "minecraft-camp",
    name: "Minecraft Camp",
    version: "1.0.0",
    author: "Webshop Engine",
    description: "Pixel-styled summer camp booking storefront.",
    screenshots: ["/template-previews/minecraft-camp.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: [],
      restyles: ["home"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "landing",
  },
  defaultTheme: minecraftCampTheme,
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
      allowedBlocks: ["hero", "about", "gallery", "contact", "richText"],
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
  campPages: {
    jegyvasarlas: {
      schema: campListContentSchema,
      defaultContent: campListDefaultContent,
      Render: CampListRender,
      EditorPanel: CampSurfaceEditorPanel,
    },
    foglalas: {
      schema: campBookingContentSchema,
      defaultContent: campBookingDefaultContent,
      Render: CampBookingRender,
      EditorPanel: CampSurfaceEditorPanel,
    },
    foglalasSiker: {
      schema: campSuccessContentSchema,
      defaultContent: campSuccessDefaultContent,
      Render: CampSuccessRender,
      EditorPanel: CampSurfaceEditorPanel,
    },
  },
})

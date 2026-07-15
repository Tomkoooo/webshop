import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { worldDartsFestivalTheme } from "./theme"
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
  tBookBookingContentSchema,
  tBookListContentSchema,
  tBookSuccessContentSchema,
} from "./pages/tbook/schemas"
import {
  tBookBookingDefaultContent,
  tBookListDefaultContent,
  tBookSuccessDefaultContent,
} from "./pages/tbook/defaultContent"
import { TBookListRender } from "./pages/tbook/jegyek/Render"
import { TBookBookingRender } from "./pages/tbook/foglalas/Render"
import { TBookSuccessRender } from "./pages/tbook/foglalas-siker/Render"
import { TBookSurfaceEditorPanel } from "./pages/tbook/EditorPanel"

import { importantInfoSchema } from "./static-pages/fontos-informaciok/schema"
import { importantInfoDefaultContent } from "./static-pages/fontos-informaciok/defaultContent"
import { ImportantInfoRender } from "./static-pages/fontos-informaciok/Render"

const ImportantInfoEditorPanel = dynamic(() =>
  import("./static-pages/fontos-informaciok/EditorPanel").then((m) => m.ImportantInfoEditorPanel)
)

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))

export const worldDartsFestival: TemplateModule = defineTemplate({
  manifest: {
    id: "world-darts-festival",
    name: "World Darts Festival",
    version: "1.0.0",
    author: "Webshop Engine",
    description:
      "Festival landing (World Masters style) with tBook ticket booking, CMS navigation, and organizer contact form.",
    screenshots: ["/template-previews/world-darts-festival.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: ["fontos-informaciok"],
      staticPageLabels: {
        "fontos-informaciok": "Fontos információk",
      },
      restyles: ["home"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "landing",
  },
  defaultTheme: worldDartsFestivalTheme,
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
    "fontos-informaciok": {
      schema: importantInfoSchema,
      defaultContent: importantInfoDefaultContent,
      Render: ImportantInfoRender,
      EditorPanel: ImportantInfoEditorPanel,
    },
  },
  tBookPages: {
    jegyek: {
      schema: tBookListContentSchema,
      defaultContent: tBookListDefaultContent,
      Render: TBookListRender,
      EditorPanel: TBookSurfaceEditorPanel,
    },
    foglalas: {
      schema: tBookBookingContentSchema,
      defaultContent: tBookBookingDefaultContent,
      Render: TBookBookingRender,
      EditorPanel: TBookSurfaceEditorPanel,
    },
    foglalasSiker: {
      schema: tBookSuccessContentSchema,
      defaultContent: tBookSuccessDefaultContent,
      Render: TBookSuccessRender,
      EditorPanel: TBookSurfaceEditorPanel,
    },
  },
})

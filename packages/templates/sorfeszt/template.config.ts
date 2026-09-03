import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { sorfesztTheme } from "./theme"
import { sorfesztFooterDefaults } from "./footer-defaults"
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

import { houseRulesSchema } from "./static-pages/hazirend/schema"
import { houseRulesDefaultContent } from "./static-pages/hazirend/defaultContent"
import { HouseRulesRender } from "./static-pages/hazirend/Render"

const HouseRulesEditorPanel = dynamic(() =>
  import("./static-pages/hazirend/EditorPanel").then((m) => m.HouseRulesEditorPanel)
)

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))

export const sorfeszt: TemplateModule = defineTemplate({
  manifest: {
    id: "sorfeszt",
    name: "Sörfeszt",
    version: "1.0.0",
    author: "Webshop Engine",
    description:
      "Sörfesztivál landing tBook jegyvásárlással — programtáblák, sörkártyás jegyek, galéria.",
    screenshots: ["/template-previews/sorfeszt.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: ["hazirend"],
      staticPageLabels: {
        hazirend: "Házirend",
      },
      restyles: ["home"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "landing",
  },
  defaultTheme: sorfesztTheme,
  footerDefaults: sorfesztFooterDefaults,
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
      listFields: [
        {
          path: "tickets.cards",
          label: "Jegykártyák",
          titleKey: "name",
          maxItems: 12,
          fields: [
            { key: "name", label: "Név" },
            { key: "price", label: "Ár" },
            { key: "badge", label: "Jelvény (pl. earlybird / Hamarosan)" },
            { key: "ctaLabel", label: "Gomb felirat" },
            { key: "ctaHref", label: "Gomb link", type: "link" },
          ],
        },
        {
          path: "schedule.days",
          label: "Programnapok",
          titleKey: "title",
          maxItems: 8,
          fields: [
            { key: "date", label: "Dátum" },
            { key: "title", label: "Nap neve" },
            { key: "hours", label: "Nyitvatartás" },
            { key: "accent", label: "Szín (primary / secondary / accent)" },
          ],
        },
        {
          path: "hours.days",
          label: "Nyitvatartás",
          titleKey: "day",
          maxItems: 8,
          fields: [
            { key: "day", label: "Nap" },
            { key: "hours", label: "Órák" },
          ],
        },
        {
          path: "gallery.items",
          label: "Galéria",
          titleKey: "caption",
          maxItems: 48,
          fields: [
            { key: "image", label: "Kép", type: "image" },
            { key: "caption", label: "Felirat" },
          ],
        },
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
    hazirend: {
      schema: houseRulesSchema,
      defaultContent: houseRulesDefaultContent,
      Render: HouseRulesRender,
      EditorPanel: HouseRulesEditorPanel,
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

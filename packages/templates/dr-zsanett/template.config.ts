import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { drZsanettTheme } from "./theme"
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

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))

export const drZsanett: TemplateModule = defineTemplate({
  manifest: {
    id: "dr-zsanett",
    name: "Dr. Jámbrik Zsanett",
    version: "1.0.0",
    author: "Webshop Engine",
    description:
      "Ügyvédi iroda landing oldal — elegáns, minimalista megjelenés vizuális CMS támogatással.",
    screenshots: ["/template-previews/dr-zsanett.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: [],
      restyles: ["home"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "landing",
  },
  defaultTheme: drZsanettTheme,
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
          path: "practiceAreas.items",
          label: "Szakterületek",
          titleKey: "title",
          maxItems: 8,
          fields: [
            { key: "icon", label: "Ikon (family|civil|property|health|labor|generic)" },
            { key: "title", label: "Cím" },
            { key: "description", label: "Leírás", type: "multiline" },
          ],
        },
        {
          path: "testimonials.items",
          label: "Vélemények",
          titleKey: "author",
          maxItems: 8,
          fields: [
            { key: "quote", label: "Idézet", type: "multiline" },
            { key: "author", label: "Szerző" },
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
  staticPages: {},
})

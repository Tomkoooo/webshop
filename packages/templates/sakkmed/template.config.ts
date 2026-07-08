import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { STATIC_PAGE_SLUGS } from "./lib/constants"
import { sakkmedTheme } from "./theme"
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

import { sakkmedPageSchema } from "./static-pages/shared/schema"
import { SAKKMED_STATIC_DEFAULTS } from "./static-pages/shared/defaults"
import { SakkmedPageRender } from "./static-pages/shared/Render"

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))
const SakkmedPageEditorPanel = dynamic(() =>
  import("./static-pages/shared/EditorPanel").then((m) => m.SakkmedPageEditorPanel)
)

const staticPages = Object.fromEntries(
  STATIC_PAGE_SLUGS.map((slug) => [
    slug,
    {
      schema: sakkmedPageSchema,
      defaultContent: SAKKMED_STATIC_DEFAULTS[slug],
      Render: SakkmedPageRender,
      EditorPanel: SakkmedPageEditorPanel,
      listFields: [
        {
          path: "sections",
          label: "Szekciók",
          titleKey: "heading",
          maxItems: 24,
          fields: [
            { key: "heading", label: "Cím" },
            { key: "body", label: "Szöveg", type: "multiline" as const },
            { key: "image", label: "Kép", type: "image" as const },
          ],
        },
        {
          path: "gallery",
          label: "Galéria",
          titleKey: "caption",
          maxItems: 64,
          fields: [
            { key: "image", label: "Kép", type: "image" as const },
            { key: "caption", label: "Felirat" },
          ],
        },
      ],
    },
  ])
)

export const sakkmed: TemplateModule = defineTemplate({
  manifest: {
    id: "sakkmed",
    name: "SAKKMED",
    version: "1.0.0",
    author: "Webshop Engine",
    description: "Rendezvénytechnika és kivitelezés — landing oldal kapcsolatfelvételi űrlappal.",
    screenshots: ["/template-previews/sakkmed.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: [...STATIC_PAGE_SLUGS],
      restyles: ["home"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "landing",
  },
  defaultTheme: sakkmedTheme,
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
      allowedBlocks: ["hero", "about", "features", "gallery", "contact", "richText"],
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
  staticPages,
})

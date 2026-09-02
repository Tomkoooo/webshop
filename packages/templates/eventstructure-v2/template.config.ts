import {
  DEFAULT_TEMPLATE_SURFACES,
  defineTemplate,
  type TemplateModule,
} from "@wse/sdk/templates/types"
import dynamic from "next/dynamic"
import { STATIC_PAGE_SLUGS } from "./lib/constants"
import { eventstructureV2Theme } from "./theme"
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

import { esPageSchema } from "./static-pages/shared/schema"
import { ES_STATIC_DEFAULTS } from "./static-pages/shared/defaults"
import { EsPageRender } from "./static-pages/shared/Render"

const HomeEditorPanel = dynamic(() => import("./pages/home/EditorPanel").then((m) => m.HomeEditorPanel))
const ShopEditorPanel = dynamic(() => import("./pages/shop/EditorPanel").then((m) => m.ShopEditorPanel))
const PdpEditorPanel = dynamic(() => import("./pages/pdp/EditorPanel").then((m) => m.PdpEditorPanel))
const EsPageEditorPanel = dynamic(() =>
  import("./static-pages/shared/EditorPanel").then((m) => m.EsPageEditorPanel)
)

const staticPages = Object.fromEntries(
  STATIC_PAGE_SLUGS.map((slug) => [
    slug,
    {
      schema: esPageSchema,
      defaultContent: ES_STATIC_DEFAULTS[slug],
      Render: EsPageRender,
      EditorPanel: EsPageEditorPanel,
      listFields: [
        {
          path: "sections",
          label: "Sections",
          titleKey: "heading",
          maxItems: 24,
          fields: [
            { key: "heading", label: "Heading" },
            { key: "body", label: "Body", type: "multiline" as const },
            { key: "image", label: "Image", type: "image" as const },
          ],
        },
        {
          path: "gallery",
          label: "Gallery",
          titleKey: "caption",
          maxItems: 64,
          fields: [
            { key: "image", label: "Image", type: "image" as const },
            { key: "caption", label: "Caption" },
          ],
        },
      ],
    },
  ])
)

export const eventstructureV2: TemplateModule = defineTemplate({
  manifest: {
    id: "eventstructure-v2",
    name: "Event Structure v2",
    version: "1.0.0",
    author: "Webshop Engine",
    description:
      "Event Structure agency landing from the PPT: white paper, pipe nav, grayscale photography, parallax and scroll reveals.",
    screenshots: ["/template-previews/eventstructure-v2.svg"],
    capabilities: {
      hasBlog: false,
      staticPages: [...STATIC_PAGE_SLUGS],
      restyles: ["home"],
    },
    surfaces: DEFAULT_TEMPLATE_SURFACES,
    deployment: "landing",
  },
  defaultTheme: eventstructureV2Theme,
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

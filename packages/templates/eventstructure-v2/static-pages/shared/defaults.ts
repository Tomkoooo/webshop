import type { EsPageContent } from "./schema"
import { ASSET, ES_EMAIL } from "../../lib/constants"

function page(
  title: string,
  subtitle: string,
  image: string,
  sections: Array<{ heading?: string; body: string; image?: string }>,
  gallery: Array<{ image?: string; caption?: string }> = []
): EsPageContent {
  return {
    hero: { title, subtitle, image },
    sections: sections.map((s) => ({
      heading: s.heading ?? "",
      body: s.body,
      image: s.image ?? "",
    })),
    gallery: gallery.map((g) => ({
      image: g.image ?? "",
      caption: g.caption ?? "",
    })),
    contactEmail: ES_EMAIL,
    contactLabel: "Let's talk",
    meta: {
      seoTitle: `${title} | Event Structure`,
      seoDescription: subtitle.slice(0, 160),
    },
  }
}

export const ES_STATIC_DEFAULTS: Record<string, EsPageContent> = {
  about: page(
    "About",
    "We're an experiential event marketing agency that designs and delivers brand activations, immersive environments and interactive installations that make impact.",
    ASSET.portrait,
    [
      {
        heading: "Transforming spaces into experiences",
        body: "With temporary structures that go beyond utility. Experiential activations people feel, not just see.",
        image: ASSET.exhibitions,
      },
      {
        heading: "We start with why, not what.",
        body: "Before we touch a build or brief a designer, we get under the skin of your brand, your audience and what you actually need the experience to do. Strategy isn't just a phase. It's the whole point.",
      },
      {
        heading: "We're there on the day. And the day after.",
        body: "Strategy, creative, fabrication, build, installation, rigging (and de-rigging). We've found our clients enjoy working with one team all the way through — because great ideas get lost in handoffs.",
        image: ASSET.hero,
      },
    ],
    [{ image: ASSET.portrait, caption: "Csomor Tamás, COO, Partner" }]
  ),
  work: page(
    "Work",
    "Brand environments, festival architecture, sports infrastructure and live production — built in Hungary, delivered on site.",
    ASSET.festivals,
    [
      {
        heading: "Spaces people walk into",
        body: "From a 10 m² stage to full event delivery, every project gets the same focus. We build it. We install it. We even run it on the day for you.",
      },
    ],
    [
      { image: ASSET.exhibitions, caption: "Bolt activation" },
      { image: ASSET.festivals, caption: "MOL VIP · Strand" },
      { image: ASSET.sports, caption: "IRONMAN 70.3 Budapest" },
      { image: ASSET.film, caption: "Live stage" },
      { image: ASSET.booth, caption: "Exhibition system" },
      { image: ASSET.stage, caption: "Festival architecture" },
      { image: ASSET.work[0], caption: "Custom structure" },
      { image: ASSET.work[2], caption: "Grandstand" },
      { image: ASSET.work[4], caption: "Covered stage" },
      { image: ASSET.work[7], caption: "Night production" },
    ]
  ),
  services: page(
    "Our Services",
    "Mobile trailer, showtrailer, container bar, grandstands, truss and Layher stage systems — production and technical delivery from Event Structure Hungary.",
    "",
    [
      { heading: "Mobile trailer | Showtrailer", body: "" },
      { heading: "Container bar", body: "" },
      { heading: "Grandstands", body: "" },
      { heading: "Truss", body: "" },
      { heading: "Layher Stage Systems", body: "" },
    ],
    []
  ),
}

import type { AboutContent } from "./schema"

export const aboutDefaultContent: AboutContent = {
  hero: {
    title: "A small studio, patient hands.",
    subtitle:
      "Eleven people, one workshop on the outskirts of Brussels, and a shared conviction that a house should be drawn before it is built.",
    image: "/template-assets/cabinova/interior-warm.jpg",
  },
  sections: [
    {
      heading: "Founded in 2014",
      body: "<p>We design, fabricate, and deliver modular houses across Belgium, the Netherlands, France, and the Scandinavian coast.</p><p>Our approach is unusual only in its restraint. We refuse projects that require us to compromise the catalog.</p>",
      image: "/template-assets/cabinova/detail-timber.jpg",
      layout: "imageRight",
    },
    {
      heading: "Consistency over novelty",
      body: "<p>What we offer instead is consistency. A house built next year will be built the same way as a house built last year, because the calibration of the parts does not change.</p>",
      image: "/template-assets/cabinova/interior-warm.jpg",
      layout: "imageLeft",
    },
  ],
  meta: {
    seoTitle: "Studio — Cabinova",
    seoDescription: "A small architecture studio building modular houses with calibrated parts and patient hands.",
  },
}

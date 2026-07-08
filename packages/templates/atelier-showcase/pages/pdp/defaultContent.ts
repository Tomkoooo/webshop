import { pdpSchema, type PdpContent } from "./schema"

export const pdpDefaultContent: PdpContent = pdpSchema.parse({
  introPlacement: "belowHero",
  showRelatedProducts: true,
  showRecentlyViewed: false,
  ctaLabel: "Add to bag",
  outOfStockLabel: "Sold out",
  galleryStyle: "thumbs",
  editorial: {
    eyebrow: "Atelier line",
    title: "Designed to sit beside books and brass",
    body: "Use this band for materials, provenance, or care — it renders below the gallery when intro placement is “below hero” so photography leads.",
    highlights: [
      { label: "Finish", detail: "Wax and buffed edges" },
      { label: "Scale", detail: "Fits standard EU shelves" },
    ],
    supportTitle: "Questions?",
    supportBody: "We answer within one business day.",
    faq: [
      { question: "Is this template safe for production?", answer: "It is a showcase skin — review tokens and copy before launch." },
    ],
    ctaLabel: "",
    addedLabel: "Recently restocked",
  },
})

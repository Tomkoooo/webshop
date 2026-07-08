import type { PdpContent } from "./schema"

export const pdpDefaultContent: PdpContent = {
  showRelatedProducts: true,
  showRecentlyViewed: false,
  ctaLabel: "Begin a project",
  outOfStockLabel: "Unavailable",
  galleryStyle: "thumbs",
  introPlacement: "belowHero",
  heroEyebrow: "",
  tagline: "",
  overviewBody: "",
  specs: [
    { label: "Area", value: "" },
    { label: "Bedrooms", value: "" },
    { label: "Lead time", value: "" },
    { label: "From", value: "" },
  ],
  materials: [],
  detailImage: "",
  detailCaption: "",
  ctaTitle: "Reserve a build slot.",
  ctaBody:
    "Slots open quarterly. Reservation requires only a site address and a fully refundable deposit.",
  ctaHref: "/contact",
  showNextModel: true,
  editorial: {
    eyebrow: "",
    title: "",
    body: "",
    highlights: [],
    supportTitle: "",
    supportBody: "",
    faq: [],
    ctaLabel: "Begin a project",
    addedLabel: "",
  },
}

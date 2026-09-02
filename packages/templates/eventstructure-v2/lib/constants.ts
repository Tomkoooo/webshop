export const ES_BRAND = "Event Structure"
export const ES_TAGLINE = "Creating impactful brand experiences and memorable environments."

export const ES_INSTAGRAM = "https://www.instagram.com/eventstructure/"
export const ES_LINKEDIN = "https://www.linkedin.com/company/eventstructure/"
export const ES_EMAIL = "hello@eventstructure.hu"
export const ES_PHONE = "+36 30 279 3932"
export const ES_ADDRESS_LINES = ["HUNGARY", "1025, Budapest,", "Dózsa Gy. u. 1.", "BOK Rendezvényközpont"] as const
export const ES_ADDRESS = "1025, Budapest, Dózsa Gy. u. 1. BOK Rendezvényközpont"

export const NAV_LINKS = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Service", href: "/services" },
  { label: "Contact", href: "/#contact" },
] as const

export const STATIC_PAGE_SLUGS = ["about", "work", "services"] as const

export type EsStaticSlug = (typeof STATIC_PAGE_SLUGS)[number]

export const ASSET = {
  logo: "/templates/eventstructure-v2/logo.png",
  skyline: "/templates/eventstructure-v2/skyline.jpg",
  hero: "/templates/eventstructure-v2/hero-truss.jpg",
  portrait: "/templates/eventstructure-v2/portrait-coo.png",
  sports: "/templates/eventstructure-v2/sector-sports.jpg",
  festivals: "/templates/eventstructure-v2/sector-festivals.jpg",
  exhibitions: "/templates/eventstructure-v2/sector-exhibitions.jpg",
  film: "/templates/eventstructure-v2/sector-film.jpg",
  art: "/templates/eventstructure-v2/sector-art.jpg",
  booth: "/templates/eventstructure-v2/work-booth.jpg",
  stage: "/templates/eventstructure-v2/work-stage.jpg",
  radios: "/templates/eventstructure-v2/work-radios.jpg",
  syma: "/templates/eventstructure-v2/work-syma.jpg",
  work: [
    "/templates/eventstructure-v2/work-01.jpg",
    "/templates/eventstructure-v2/work-02.jpg",
    "/templates/eventstructure-v2/work-03.jpg",
    "/templates/eventstructure-v2/work-04.jpg",
    "/templates/eventstructure-v2/work-05.jpg",
    "/templates/eventstructure-v2/work-06.jpg",
    "/templates/eventstructure-v2/work-07.jpg",
    "/templates/eventstructure-v2/work-08.jpg",
  ],
} as const

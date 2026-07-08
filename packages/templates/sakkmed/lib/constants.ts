export const SAKKMED_BRAND = "SAKKMED 2005 Kft."
export const SAKKMED_TAGLINE = "A sikeres rendezvény kivitelezője"

export const SAKKMED_FACEBOOK = "https://www.facebook.com/sakkmed"
export const SAKKMED_INSTAGRAM = "https://www.instagram.com/esemenyszervezes/"

export const SERVICE_LINKS = [
  { label: "Bútoraink", href: "/butoraink" },
  { label: "Installációk", href: "/installaciok" },
  { label: "Traverz", href: "/traverz" },
  { label: "Layher", href: "/layher" },
  { label: "Emeléstechnika", href: "/emelestechnika" },
  { label: "Alutent", href: "/alutent" },
  { label: "Áramhálózat", href: "/aramhalozat" },
  { label: "Vízmű", href: "/vizmu" },
  { label: "Syma", href: "/syma" },
] as const

export const PROJECT_LINKS = [
  { label: "Fesztivál VIP", href: "/fesztival-vip" },
  { label: "Sigma konténer", href: "/sigma-kontener" },
] as const

export const STATIC_PAGE_SLUGS = [
  ...SERVICE_LINKS.map((l) => l.href.slice(1)),
  ...PROJECT_LINKS.map((l) => l.href.slice(1)),
] as const

export type SakkmedStaticSlug = (typeof STATIC_PAGE_SLUGS)[number]

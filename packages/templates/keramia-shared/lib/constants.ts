export const KERAMIA_BRAND = "Kerámia Dental"
export const KERAMIA_BRAND_SHORT = "KERÁMIA"
export const KERAMIA_BRAND_SUB = "D E N T A L"
export const KERAMIA_LOGO = "/templates/keramia-shared/logo.png"
export const KERAMIA_HERO_HUB = "/templates/keramia-shared/hero-hub.jpg"
export const KERAMIA_PHONE = "+36 20 244 8888"
export const KERAMIA_PHONE_HREF = "tel:+36202448888"
export const KERAMIA_EMAIL = "fogaszat@keramiadental.hu"
export const KERAMIA_ADDRESS = "Székesfehérvár, Szekfű Gy. u. 12."
export const KERAMIA_ADDRESS_EN = "Szekfű Gy. u. 12, Székesfehérvár, Hungary"
export const KERAMIA_PROMO_PERIOD_HU = "Nyári akció • jún. 1. – aug. 31."
export const KERAMIA_PROMO_PERIOD_EN = "New Patient Special · Jun 1 – Aug 31"
export const KERAMIA_PROMO_PERIOD_LONG = "2026. június 1. – augusztus 31."

export const HUB_TRUST_POINTS = [
  { title: "Prémium rendelő", description: "Modern digitális technológia Székesfehérvár szívében." },
  { title: "Fájdalommentes ellátás", description: "Kíméletes, személyre szabott kezelési tervek." },
  { title: "Angolul is", description: "New Patient Special — fluent English-speaking team." },
  { title: "Online kedvezmény", description: "A nyári akciók online jelentkezéssel érvényesek." },
] as const

export const CAMPAIGN_LINKS = [
  {
    slug: "fogfeherites",
    labelHu: "Fogfehérítés + fogkőleszedés",
    labelEn: "Teeth whitening",
    href: "/fogfeherites",
    descriptionHu:
      "Ragyogó, fehér mosoly egyetlen óra alatt — 10% + 10% kedvezmény a fogkőleszedésre és a rendelői fehérítésre.",
    descriptionEn: "10% + 10% off whitening and scaling.",
    promoBadge: "10% + 10%",
    promoDetail: "fogkőleszedés + fehérítés",
    image: "/templates/keramia-shared/campaign-fogfeherites.jpg",
    locale: "hu" as const,
    featured: true,
  },
  {
    slug: "implant",
    labelHu: "Fogpótlás + implantáció",
    labelEn: "Implants & prosthetics",
    href: "/implant",
    descriptionHu:
      "Prémium implantátumok és élethű koronák 3D CT-diagnosztikával — 10% kedvezmény a teljes fogpótlásra.",
    descriptionEn: "10% off the full prosthetics palette.",
    promoBadge: "10%",
    promoDetail: "teljes fogpótlás",
    image: "/templates/keramia-shared/campaign-implant.jpg",
    locale: "hu" as const,
    featured: false,
  },
  {
    slug: "newpatient",
    labelHu: "New Patient Special",
    labelEn: "New Patient Special",
    href: "/newpatient",
    descriptionHu:
      "Teljes első vizit angolul: vizsgálat, fogkőleszedés, panoráma röntgen — 30 000 Ft helyett 55 000 Ft.",
    descriptionEn: "Complete first visit for 30,000 Ft instead of 55,000 Ft.",
    promoBadge: "30 000 Ft",
    promoDetail: "helyett 55 000 Ft",
    image: "/templates/keramia-shared/campaign-newpatient.jpg",
    locale: "en" as const,
    featured: false,
  },
] as const

export const STATIC_PAGE_SLUGS = ["fogfeherites", "implant", "newpatient"] as const

export type KeramiaCampaignSlug = (typeof STATIC_PAGE_SLUGS)[number]

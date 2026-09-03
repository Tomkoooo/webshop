import type { FooterSettings } from "@wse/sdk/templates/types"

export const sorfesztFooterDefaults: FooterSettings = {
  tagline: "Sörfeszt 2026 — kóstolók, koncertek és versenyek egy hétvégén.",
  quickLinksTitle: "Gyors linkek",
  quickLinks: [
    { label: "Jegyvásárlás", href: "/jegyek" },
    { label: "Program", href: "/#programok" },
    { label: "Jegyek", href: "/#jegyek" },
    { label: "Nyitvatartás", href: "/#nyitvatartas" },
    { label: "Galéria", href: "/#galeria" },
    { label: "Házirend", href: "/hazirend" },
    { label: "Kapcsolat", href: "/#kapcsolat" },
  ],
  categoriesTitle: "",
  browseProductsLabel: "",
  contactTitle: "Elérhetőség",
  newsletterLabel: "",
  newsletterPlaceholder: "",
  copyrightText: "© {year} {brand}. Minden jog fenntartva.",
  socialLinks: [
    { platform: "facebook", enabled: false, url: "" },
    { platform: "instagram", enabled: false, url: "" },
    { platform: "twitter", enabled: false, url: "" },
    { platform: "youtube", enabled: false, url: "" },
  ],
  contactEntries: [],
  organizerSection: {
    title: "Szervező",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours:
      "2026. október 2, péntek 16:00–23:00 · 3. szombat 13:00–23:00 · 4. vasárnap 13:00–23:00",
    taxNumber: "",
  },
  paymentMethodsNote: "",
}

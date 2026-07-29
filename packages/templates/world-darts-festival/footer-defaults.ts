import type { FooterSettings } from "@wse/sdk/templates/types"

/** Festival footer baseline — independent from shop / KockaKemp defaults. */
export const wdfFooterDefaults: FooterSettings = {
  tagline: "The international darts festival in Budapest — entries, schedule, and prize money.",
  quickLinksTitle: "Quick links",
  quickLinks: [
    { label: "Entries & booking", href: "/jegyek" },
    { label: "Venue", href: "/#venue" },
    { label: "Schedule", href: "/#schedule" },
    { label: "Prize money", href: "/#prize-money" },
    { label: "Contact", href: "/#contact" },
  ],
  categoriesTitle: "",
  browseProductsLabel: "",
  contactTitle: "Contact",
  newsletterLabel: "",
  newsletterPlaceholder: "",
  copyrightText: "© {year} {brand}. All rights reserved.",
  socialLinks: [
    { platform: "facebook", enabled: false, url: "" },
    { platform: "instagram", enabled: false, url: "" },
    { platform: "twitter", enabled: false, url: "" },
    { platform: "youtube", enabled: false, url: "" },
  ],
  contactEntries: [],
  organizerSection: {
    title: "",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours: "",
    taxNumber: "",
  },
  paymentMethodsNote: "",
}

/** Hungarian fallback — used only when no `footer:world-darts-festival@hu` document exists yet. */
export const wdfFooterDefaultsHu: FooterSettings = {
  tagline: "A nemzetközi darts fesztivál Budapesten — nevezés, program és díjazás.",
  quickLinksTitle: "Gyors linkek",
  quickLinks: [
    { label: "Nevezés és foglalás", href: "/jegyek" },
    { label: "Helyszín", href: "/#venue" },
    { label: "Program", href: "/#schedule" },
    { label: "Díjazás", href: "/#prize-money" },
    { label: "Kapcsolat", href: "/#contact" },
  ],
  categoriesTitle: "",
  browseProductsLabel: "",
  contactTitle: "Kapcsolat",
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
    title: "",
    companyName: "",
    registeredAddress: "",
    mailingAddress: "",
    openingHours: "",
    taxNumber: "",
  },
  paymentMethodsNote: "",
}

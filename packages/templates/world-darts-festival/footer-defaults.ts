import type { FooterSettings } from "@wse/sdk/templates/types"

/** Festival footer baseline — independent from shop / KockaKemp defaults. */
export const wdfFooterDefaults: FooterSettings = {
  tagline: "A nemzetközi darts fesztivál Budapesten — jegyek, program, díjazás.",
  quickLinksTitle: "Gyors linkek",
  quickLinks: [
    { label: "Jegyek & foglalás", href: "/jegyek" },
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

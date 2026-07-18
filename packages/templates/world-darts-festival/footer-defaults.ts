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

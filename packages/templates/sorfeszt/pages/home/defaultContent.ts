import type { HomeContent } from "./schema"
import { DEFAULT_SORFESZT_SECTION_LAYOUT } from "../../lib/sorfeszt-home-sections"

export const homeDefaultContent: HomeContent = {
  chrome: {
    tbookApiKey: "",
    navCta: {
      enabled: true,
      label: "Jegyek",
      mobileLabel: "Jegyvásárlás",
      href: "/jegyek",
      showIcon: true,
    },
    nav: [
      { type: "link", label: "Főoldal", href: "/" },
      { type: "link", label: "Helyszín", href: "/#helyszin" },
      { type: "link", label: "Jegyek", href: "/#jegyek" },
      { type: "link", label: "Programok", href: "/#programok" },
      { type: "link", label: "Sörök", href: "/#sorok" },
      { type: "link", label: "Galéria", href: "/#galeria" },
      { type: "link", label: "Házirend", href: "/hazirend" },
    ],
    tickerText: "",
  },
  sectionLayout: DEFAULT_SORFESZT_SECTION_LAYOUT.map((row) => ({ ...row })),
  hero: {
    tagline: "Sörfeszt 2026 — október 2–4.",
    title: "Fedezd fel a Sörfesztivál kalandjait",
    subtitle:
      "Több száz különleges sör, kóstolók, koncertek és versenyek egy hétvégén. Válaszd ki a jegyed és a napot, amikor jössz — várunk szeretettel.",
    heroImage: "/generic-hero.svg",
    primaryCtaLabel: "Jegyvásárlás",
    primaryCtaHref: "/jegyek",
    secondaryCtaLabel: "Programok",
    secondaryCtaHref: "/#programok",
  },
  venue: {
    heading: "Helyszín",
    name: "Helyszín hamarosan",
    body:
      "A fesztivál helyszíne nem Győr. A pontos címet és a megközelítést itt frissítjük, amint végleges. Addig a jegytípusokat és a programot böngészheted.",
    mapLabel: "Útvonaltervező",
    mapHref: "",
    mapEmbedUrl: "",
    image: "",
  },
  tickets: {
    heading: "Jegyek",
    intro:
      "A jegyek a tBook eseményekből jönnek — válaszd a típust (napijegy, VIP, asztal) és a napot. A leírás a kártyán a tBook adminból szerkeszthető.",
    cards: [
      {
        name: "Napijegy earlybird",
        price: "5 990 Ft",
        badge: "Egyenlőre ez megy",
        includes: ["Belépés", "3 db kóstolójegy"],
        ctaLabel: "Jegyvásárlás",
        ctaHref: "/jegyek",
      },
      {
        name: "Napijegy normál",
        price: "7 990 Ft",
        badge: "Hamarosan",
        includes: ["Belépés", "3 db kóstolójegy"],
        ctaLabel: "Hamarosan",
        ctaHref: "",
      },
      {
        name: "VIP Napijegy earlybird",
        price: "9 990 Ft",
        badge: "Egyenlőre ez megy",
        includes: ["Belépés", "7 db kóstolójegy", "Külön rész hideg kísérőételekkel"],
        ctaLabel: "Jegyvásárlás",
        ctaHref: "/jegyek",
      },
      {
        name: "VIP Napijegy normál",
        price: "14 990 Ft",
        badge: "Hamarosan",
        includes: ["Belépés", "7 db kóstolójegy", "Külön rész hideg kísérőételekkel"],
        ctaLabel: "Hamarosan",
        ctaHref: "",
      },
      {
        name: "Asztal 6 fő részére",
        price: "35 990 Ft",
        badge: "",
        includes: [
          "Belépés 6 fő részére",
          "20 db kóstolójegy",
          "Külön rész hideg kísérőételekkel",
        ],
        ctaLabel: "Asztalfoglalás",
        ctaHref: "/jegyek",
      },
    ],
  },
  ribbons: {
    beforeTickets:
      "A rendezvényre a belépés jeggyel történik — a kóstolójegyek a csomagban vannak, a pohár a helyszínen kapható.",
    afterBeers: "Köszönjük mindenkinek, aki kilátogat — október 2–4., jövőre újra találkozunk!",
  },
  beers: {
    heading: "Sörök",
    body: "A fesztiválon megkóstolható sörök — a lista folyamatosan bővül.",
    emptyLabel: "Hamarosan",
    cards: [],
  },
  schedule: {
    heading: "Programok",
    intro: "Három nap — versenyek délután, koncertek este.",
    days: [
      {
        date: "2026. október 2.",
        title: "Péntek",
        hours: "16:00 – 23:00",
        accent: "primary",
        items: [
          { time: "16:00", title: "Kő-papír-olló verseny" },
          { time: "19:00", title: "Koncert 1." },
          { time: "21:00", title: "Koncert 2." },
        ],
      },
      {
        date: "2026. október 3.",
        title: "Szombat",
        hours: "13:00 – 23:00",
        accent: "secondary",
        items: [
          { time: "13:00", title: "Darts verseny" },
          { time: "16:00", title: "Beer pong verseny" },
          { time: "19:00", title: "Koncert 3." },
          { time: "21:00", title: "Koncert 4." },
        ],
      },
      {
        date: "2026. október 4.",
        title: "Vasárnap",
        hours: "13:00 – 23:00",
        accent: "accent",
        items: [
          { time: "13:00", title: "Csocsó verseny" },
          { time: "19:00", title: "Koncert 5." },
        ],
      },
    ],
  },
  hours: {
    heading: "Nyitvatartás",
    intro: "Három napos fesztivál — válaszd ki, melyik napon jössz a jegyvásárláskor.",
    days: [
      { day: "2026. október 2, péntek", hours: "16:00 – 23:00" },
      { day: "2026. október 3, szombat", hours: "13:00 – 23:00" },
      { day: "2026. október 4, vasárnap", hours: "13:00 – 23:00" },
    ],
  },
  gallery: {
    heading: "Galéria",
    emptyLabel: "Hamarosan",
    items: [],
  },
  contact: {
    heading: "Kapcsolat",
    body: "Kérdésed van a jegyekkel, a programmal vagy a helyszínnel kapcsolatban? Írj nekünk.",
    nameLabel: "Név",
    emailLabel: "E-mail",
    messageLabel: "Üzenet",
    sendButtonLabel: "Üzenet küldése",
  },
  meta: {
    seoTitle: "Sörfeszt 2026",
    seoDescription:
      "Sörfesztivál 2026. október 2–4. Napijegy, VIP és asztal — belépés, kóstolójegyek, koncertek és versenyek.",
  },
}

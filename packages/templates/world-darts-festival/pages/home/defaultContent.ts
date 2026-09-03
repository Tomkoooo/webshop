import type { HomeContent } from "./schema"
import { DEFAULT_WDF_SECTION_LAYOUT } from "../../lib/wdf-home-sections"

export const homeDefaultContent: HomeContent = {
  chrome: {
    tbookApiKey: "",
    navCta: {
      enabled: true,
      label: "Entries",
      mobileLabel: "Entries & booking",
      href: "/jegyek",
      showIcon: true,
    },
    nav: [
      { type: "link", label: "Home", href: "/" },
      {
        type: "dropdown",
        label: "Events",
        items: [
          { label: "All events", href: "/jegyek" },
          { label: "Book now", href: "/jegyek" },
        ],
      },
      { type: "link", label: "Venue", href: "/#venue" },
      { type: "link", label: "Schedule", href: "/#schedule" },
      { type: "link", label: "Prize money", href: "/#prize-money" },
      { type: "link", label: "Contact", href: "/#contact" },
    ],
    tickerText:
      "World Darts Festival 2025 — Budapest  ·  Entries now open  ·  World Masters  ·  Lakeside Qualifier",
  },
  sectionLayout: DEFAULT_WDF_SECTION_LAYOUT.map((row) => ({ ...row })),
  hero: {
    tagline: "World Darts Festival 2025 — Budapest, Hungary",
    title: "Welcome to the WDF World Masters",
    subtitle:
      "Join us to witness legends in the making at one of darts' most prestigious tournaments — thrilling matches, world-class talent, and an unforgettable festival atmosphere.",
    heroImage: "/generic-hero.svg",
    primaryCtaLabel: "Booking and entry",
    primaryCtaHref: "/jegyek",
    secondaryCtaLabel: "Entries",
    secondaryCtaHref: "/jegyek",
  },
  festival: {
    title: "2025 World Darts Festival",
    body:
      "Following a successful 2024, Hungary proudly welcomes back the World Darts Federation's most prestigious events in 2025 — the World Championship Qualifier and the World Masters. Introducing the World Darts Festival — a thrilling 9-day celebration of darts like never before!",
    image: "/generic-hero.svg",
    ctaLabel: "Entries",
    ctaHref: "/jegyek",
  },
  infoCards: [
    {
      title: "Important information",
      body: "Read detailed information about registration, rules and playing format. Everything you need to know is just one click away.",
      ctaLabel: "Read more",
      ctaHref: "/fontos-informaciok",
    },
    {
      title: "Are you on the list?",
      body: "Check the official entry lists and make sure your name is there. The date shown tells you when the list was last updated.",
      ctaLabel: "Find your name",
      ctaHref: "/jegyek",
    },
  ],
  venue: {
    heading: "Venue",
    name: "Gerevich Aladár National Sports Hall",
    body:
      "Located in the heart of Budapest, the Gerevich Aladár National Sports Hall is a premier venue for both athletes and sports fans. Named after the legendary Hungarian fencer, this facility hosts a variety of national and international events.",
    accessHeading: "Easy access",
    accessBody:
      "Conveniently situated near the city center, the hall is easily accessible by public transport, including buses, trams, and the metro.",
    mapLabel: "Show me on the map",
    mapHref: "https://maps.google.com/?q=Gerevich+Aladár+National+Sports+Hall+Budapest",
    mapEmbedUrl: "",
    image: "/generic-hero.svg",
  },
  schedule: {
    heading: "Schedule",
    days: [
      {
        date: "25th October — Saturday",
        title: "Hungarian Open",
        items: ["10:00 — Hungarian Masters — WDF Gold Category", "Men · Women · Boys · Girls"],
      },
      {
        date: "29th October — Wednesday",
        title: "World Masters",
        items: ["Group Stage — Men · Women · Para", "WDP World Masters"],
      },
      {
        date: "2nd November — Sunday",
        title: "WDF World Championship Qualifier",
        items: ["All categories"],
      },
    ],
  },
  fees: {
    heading: "Entry fees and administration fees",
    items: [
      { label: "WDF World Masters Adult", price: "€40", badge: "WDF Platinum" },
      { label: "WDF World Open Adult", price: "€35", badge: "WDF Silver" },
      { label: "Lakeside Qualifier Adult", price: "€40", badge: "" },
      { label: "Diamonds Cup Pairs Adult", price: "€60/pair", badge: "" },
    ],
    ctaLabel: "Register now",
    ctaHref: "/jegyek",
  },
  prizeMoney: {
    heading: "Prize money",
    intro: "Prize tables for each tournament at the World Darts Festival.",
    tables: [
      {
        title: "WDF World Masters",
        subtitle: "Prize — €3700",
        headers: ["Place", "Men", "Women", "Para"],
        rows: [
          ["Winner", "€5,000", "€3,500", "€1,500"],
          ["Runner-up", "€2,500", "€1,750", "€750"],
          ["Semi-finalist", "€1,000", "€750", "€350"],
        ],
      },
      {
        title: "Hungarian Open",
        subtitle: "",
        headers: ["Place", "Men", "Women"],
        rows: [
          ["Winner", "€2,000", "€1,500"],
          ["Runner-up", "€1,000", "€750"],
          ["Semi-finalist", "€500", "€350"],
        ],
      },
    ],
  },
  sponsors: {
    heading: "Sponsors and partners",
    logos: [
      { name: "Partner 1", image: "/placeholder.png" },
      { name: "Partner 2", image: "/placeholder.png" },
      { name: "Partner 3", image: "/placeholder.png" },
    ],
  },
  contact: {
    heading: "Contact the organizer",
    body: "Questions about registration, entries, or the event? Send us a message and we'll get back to you as soon as possible.",
    nameLabel: "Name",
    emailLabel: "Email",
    messageLabel: "Message",
    sendButtonLabel: "Send message",
  },
  meta: {
    seoTitle: "World Darts Festival",
    seoDescription: "Book entries and register for the World Darts Festival in Budapest.",
  },
}

/** Hungarian fallback — used only when no `page:home@hu` document exists yet. */
export const homeDefaultContentHu: HomeContent = {
  chrome: {
    tbookApiKey: "",
    navCta: {
      enabled: true,
      label: "Nevezés",
      mobileLabel: "Nevezés és foglalás",
      href: "/jegyek",
      showIcon: true,
    },
    nav: [
      { type: "link", label: "Főoldal", href: "/" },
      {
        type: "dropdown",
        label: "Események",
        items: [
          { label: "Összes esemény", href: "/jegyek" },
          { label: "Foglalás most", href: "/jegyek" },
        ],
      },
      { type: "link", label: "Helyszín", href: "/#venue" },
      { type: "link", label: "Program", href: "/#schedule" },
      { type: "link", label: "Díjazás", href: "/#prize-money" },
      { type: "link", label: "Kapcsolat", href: "/#contact" },
    ],
    tickerText:
      "World Darts Festival 2025 — Budapest  ·  Nevezés folyamatban  ·  World Masters  ·  Lakeside Qualifier",
  },
  sectionLayout: DEFAULT_WDF_SECTION_LAYOUT.map((row) => ({ ...row })),
  hero: {
    tagline: "World Darts Festival 2025 — Budapest, Magyarország",
    title: "Üdvözlünk a WDF World Masters versenyen",
    subtitle:
      "Csatlakozz hozzánk, és légy tanúja a leendő legendák születésének a darts egyik legrangosabb versenyén — izgalmas mérkőzések, világklasszis tehetségek és felejthetetlen fesztiválhangulat.",
    heroImage: "/generic-hero.svg",
    primaryCtaLabel: "Foglalás és nevezés",
    primaryCtaHref: "/jegyek",
    secondaryCtaLabel: "Nevezés",
    secondaryCtaHref: "/jegyek",
  },
  festival: {
    title: "2025 World Darts Festival",
    body:
      "A sikeres 2024-es év után Magyarország ismét büszkén ad otthont a World Darts Federation legrangosabb versenyeinek 2025-ben — a World Championship Qualifiernek és a World Mastersnek. Bemutatjuk a World Darts Festivalt — a darts eddig soha nem látott, 9 napos ünnepét!",
    image: "/generic-hero.svg",
    ctaLabel: "Nevezés",
    ctaHref: "/jegyek",
  },
  infoCards: [
    {
      title: "Fontos információk",
      body: "Olvasd el a nevezéssel, szabályokkal és a játékformátummal kapcsolatos részletes tudnivalókat. Minden, amit tudnod kell, egy kattintásra van.",
      ctaLabel: "Tovább olvasom",
      ctaHref: "/fontos-informaciok",
    },
    {
      title: "Rajta vagy a listán?",
      body: "Nézd meg a hivatalos nevezési listákat, és győződj meg róla, hogy szerepelsz rajtuk. A feltüntetett dátum mutatja, mikor frissült utoljára a lista.",
      ctaLabel: "Keresd meg a neved",
      ctaHref: "/jegyek",
    },
  ],
  venue: {
    heading: "Helyszín",
    name: "Gerevich Aladár Nemzeti Sportcsarnok",
    body:
      "Budapest szívében található a Gerevich Aladár Nemzeti Sportcsarnok, amely elsőrangú helyszínt biztosít sportolóknak és szurkolóknak egyaránt. A legendás magyar vívóról elnevezett létesítmény számos hazai és nemzetközi rendezvénynek ad otthont.",
    accessHeading: "Könnyű megközelíthetőség",
    accessBody:
      "A városközponthoz közel elhelyezkedő csarnok könnyen megközelíthető tömegközlekedéssel, busszal, villamossal és metróval egyaránt.",
    mapLabel: "Mutasd a térképen",
    mapHref: "https://maps.google.com/?q=Gerevich+Aladár+National+Sports+Hall+Budapest",
    mapEmbedUrl: "",
    image: "/generic-hero.svg",
  },
  schedule: {
    heading: "Program",
    days: [
      {
        date: "Október 25. — szombat",
        title: "Hungarian Open",
        items: ["10:00 — Hungarian Masters — WDF Gold Category", "Férfi · Női · Fiú · Lány"],
      },
      {
        date: "Október 29. — szerda",
        title: "World Masters",
        items: ["Csoportkör — Férfi · Női · Para", "WDP World Masters"],
      },
      {
        date: "November 2. — vasárnap",
        title: "WDF World Championship Qualifier",
        items: ["Minden kategória"],
      },
    ],
  },
  fees: {
    heading: "Nevezési és adminisztrációs díjak",
    items: [
      { label: "WDF World Masters felnőtt", price: "€40", badge: "WDF Platinum" },
      { label: "WDF World Open felnőtt", price: "€35", badge: "WDF Silver" },
      { label: "Lakeside Qualifier felnőtt", price: "€40", badge: "" },
      { label: "Diamonds Cup páros felnőtt", price: "€60/pár", badge: "" },
    ],
    ctaLabel: "Nevezz most",
    ctaHref: "/jegyek",
  },
  prizeMoney: {
    heading: "Díjazás",
    intro: "A World Darts Festival egyes versenyeinek díjtáblázatai.",
    tables: [
      {
        title: "WDF World Masters",
        subtitle: "Díjazás — €3700",
        headers: ["Helyezés", "Férfi", "Női", "Para"],
        rows: [
          ["Győztes", "€5,000", "€3,500", "€1,500"],
          ["Döntős", "€2,500", "€1,750", "€750"],
          ["Elődöntős", "€1,000", "€750", "€350"],
        ],
      },
      {
        title: "Hungarian Open",
        subtitle: "",
        headers: ["Helyezés", "Férfi", "Női"],
        rows: [
          ["Győztes", "€2,000", "€1,500"],
          ["Döntős", "€1,000", "€750"],
          ["Elődöntős", "€500", "€350"],
        ],
      },
    ],
  },
  sponsors: {
    heading: "Szponzorok és partnerek",
    logos: [
      { name: "Partner 1", image: "/placeholder.png" },
      { name: "Partner 2", image: "/placeholder.png" },
      { name: "Partner 3", image: "/placeholder.png" },
    ],
  },
  contact: {
    heading: "Lépj kapcsolatba a szervezővel",
    body: "Kérdésed van a nevezéssel, a jegyekkel vagy az eseménnyel kapcsolatban? Küldj nekünk üzenetet, és amint tudunk, válaszolunk.",
    nameLabel: "Név",
    emailLabel: "E-mail",
    messageLabel: "Üzenet",
    sendButtonLabel: "Üzenet küldése",
  },
  meta: {
    seoTitle: "World Darts Festival",
    seoDescription: "Foglalj nevezést és regisztrálj a budapesti World Darts Festivalra.",
  },
}

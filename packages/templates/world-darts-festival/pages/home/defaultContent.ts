import type { HomeContent } from "./schema"
import { DEFAULT_WDF_SECTION_LAYOUT } from "../../lib/wdf-home-sections"

export const homeDefaultContent: HomeContent = {
  chrome: {
    tbookApiKey: "",
    navCta: {
      enabled: true,
      label: "Jegyek",
      mobileLabel: "Jegyek & foglalás",
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
          { label: "Foglalás", href: "/jegyek" },
        ],
      },
      { type: "link", label: "Helyszín", href: "/#venue" },
      { type: "link", label: "Program", href: "/#schedule" },
      { type: "link", label: "Díjazás", href: "/#prize-money" },
      { type: "link", label: "Kapcsolat", href: "/#contact" },
    ],
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
    secondaryCtaLabel: "Tickets",
    secondaryCtaHref: "/jegyek",
  },
  festival: {
    title: "2025 World Darts Festival",
    body:
      "Following a successful 2024, Hungary proudly welcomes back the World Darts Federation's most prestigious events in 2025 — the World Championship Qualifier and the World Masters. Introducing the World Darts Festival — a thrilling 9-day celebration of darts like never before!",
    image: "/generic-hero.svg",
    ctaLabel: "Tickets",
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
    mapHref: "https://maps.google.com",
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
    body: "Questions about registration, tickets, or the event? Send us a message and we'll get back to you as soon as possible.",
    nameLabel: "Név",
    emailLabel: "Email",
    messageLabel: "Üzenet",
    sendButtonLabel: "Üzenet küldése",
  },
  meta: {
    seoTitle: "World Darts Festival",
    seoDescription: "Book tickets and register for the World Darts Festival in Budapest.",
  },
}

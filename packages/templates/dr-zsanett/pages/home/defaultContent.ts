import type { HomeContent } from "./schema"

const HERO_IMAGE =
  "https://images.pexels.com/photos/3747463/pexels-photo-3747463.jpeg?auto=compress&cs=tinysrgb&w=1600"
const ABOUT_IMAGE =
  "https://images.pexels.com/photos/5668858/pexels-photo-5668858.jpeg?auto=compress&cs=tinysrgb&w=1200"
const QUOTE_IMAGE =
  "https://images.pexels.com/photos/8112199/pexels-photo-8112199.jpeg?auto=compress&cs=tinysrgb&w=1600"
const CONTACT_IMAGE =
  "https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800"

export const homeDefaultContent: HomeContent = {
  hero: {
    logoText: "JS",
    title: "Dr. Jámbrik Zsanett Ügyvédi Iroda",
    tagline: "Jogi megoldások. Emberközpontú szemlélettel.",
    ctaLabel: "Időpontfoglalás",
    ctaHref: "tel:+36300000000",
    image: HERO_IMAGE,
    imageAlt: "Modern íróasztal könyvekkel és laptoppal",
  },
  about: {
    eyebrow: "Bemutatkozás",
    title: "Dr. Jámbrik Zsanett ügyvéd",
    body: "Ügyvédi irodám személyre szabott jogi szolgáltatásokat nyújt magánszemélyek és vállalkozások számára. Hiszek abban, hogy a hatékony jogi képviselet nemcsak a jogszabályok ismeretén, hanem az ügyfél helyzetének megértésén is múlik.\n\nCélom, hogy átlátható, megbízható és emberközpontú támogatást nyújtsak az élet fontos döntéseiben — a családjogtól az ingatlanügyletekig.",
    ctaLabel: "Tovább a bemutatkozásra",
    ctaHref: "#bemutatkozas",
    image: ABOUT_IMAGE,
    imageAlt: "Dr. Jámbrik Zsanett ügyvéd",
  },
  practiceAreas: {
    eyebrow: "Szakterületek",
    title: "Miben tudok segíteni?",
    ctaLabel: "Összes szakterület",
    ctaHref: "#szakteruletek",
    items: [
      {
        icon: "family",
        title: "Családjog",
        description: "Házasság, válás, gyermekelhelyezés és gondozás ügyekben.",
      },
      {
        icon: "civil",
        title: "Polgári jog",
        description: "Szerződések, kártérítés és polgári peres képviselet.",
      },
      {
        icon: "property",
        title: "Ingatlanjog",
        description: "Adásvétel, ajándékozás, tulajdonjog és bérleti szerződések.",
      },
      {
        icon: "health",
        title: "Egészségügyi jog",
        description: "Páciensjogok, egészségügyi kártérítés és felelősség.",
      },
      {
        icon: "labor",
        title: "Munkajog",
        description: "Munkaszerződések, felmondás és munkaügyi viták.",
      },
    ],
  },
  testimonials: {
    eyebrow: "Rólam mondták",
    title: "Ügyfeleim visszajelzései",
    items: [
      {
        quote:
          "Empatikus, precíz és mindig elérhető volt. Végig biztonságban éreztem magam az eljárás alatt.",
        author: "Katalin M.",
      },
      {
        quote: "Világosan elmagyarázta a lehetőségeimet, és hatékonyan képviselt a tárgyaláson.",
        author: "András K.",
      },
      {
        quote: "Az ingatlanügyletünk gördülékenyen zajlott — minden részletre odafigyelt.",
        author: "Eszter T.",
      },
    ],
  },
  quote: {
    text: "„A jó ügyvéd nem csak ismeri a törvényt, hanem érti az embert is.”",
    image: QUOTE_IMAGE,
    imageAlt: "Ügyvédi iroda enteriőr",
  },
  contact: {
    eyebrow: "Kapcsolat",
    title: "Keressen bizalommal!",
    phoneLabel: "Telefon",
    emailLabel: "E-mail",
    addressLabel: "Cím",
    phone: "+36 30 000 0000",
    email: "iroda@jambrikzsanett.hu",
    address: "Budapest, Magyarország",
    image: CONTACT_IMAGE,
    imageAlt: "Asztali csendélet könyvekkel és virágokkal",
    callEyebrow: "Hívás",
    callLabel: "Azonnali hívás",
    callHint: "Egy kattintással felhívhat — mobilról azonnal indul a hívás.",
  },
  meta: {
    seoTitle: "Dr. Jámbrik Zsanett Ügyvédi Iroda",
    seoDescription:
      "Jogi megoldások emberközpontú szemlélettel — családjog, polgári jog, ingatlanjog és több.",
  },
}

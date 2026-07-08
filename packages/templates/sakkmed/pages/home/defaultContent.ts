import type { HomeContent } from "./schema"
import { PROJECT_LINKS, SERVICE_LINKS } from "../../lib/constants"

const ABOUT_WHO =
  "Szakemberek vagyunk | Megbízhatóak vagyunk | Innovatívak vagyunk | Operatívak vagyunk | Nyitottak vagyunk | Rugalmasak vagyunk | Precízek vagyunk | Tapasztaltak vagyunk | Dinamikusak vagyunk | Csapat vagyunk"

const ABOUT_WHAT =
  "Események komplett műszaki felügyelete, koordinálása | Rendezvénytechnika | Hang-, fény-, színpad- és látványtechnika | Kül- és beltéri rendezvény installációk | Műszaki kivitelezés | Áram- és vízhálózat | Biztonságtechnika | Egészségügyi szolgáltatás | Eszköz bérbeadás | Mobil WC | Kordon | Kerítés | Bútorzat | Játékok kicsiknek és nagyoknak | Fotózás | Catering | Booking | Fellépők"

const ABOUT_WHERE =
  "Konferencia | Workshop | Kiállítás | Családi nap | Fesztivál | Promóció | Céges party | Csapatépítés | Márka aktivitások | Sajtótájékoztató | Esküvő | Koncert | Sportesemények | Saját rendezvények"

const ABOUT_WHY =
  "Üzletpolitikánk ügyfélközpontú. Szakmai tapasztalatunk minőségi kivitelezéssel társul. Saját eszközparkkal rendelkezünk, melyet folyamatosan fejlesztünk. Komplett kivitelezést vállalunk, így áraink csomagonként, a piaci árakhoz képest kedvezőbbek. Partnereink mindig megelégedéssel zárják a rendezvényeiket, így szívesen ajánlanak minket másoknak is."

export const homeDefaultContent: HomeContent = {
  meta: {
    seoTitle: "SAKKMED 2005 Kft. | Rendezvénytechnika és kivitelezés",
    seoDescription:
      "A sikeres rendezvény kivitelezője — hang-, fény-, színpadtechnika, installációk, bútorok és teljes műszaki háttér.",
  },
  blocks: [
    {
      id: "hero-sakkmed",
      type: "hero",
      enabled: true,
      data: {
        title: "A SIKERES",
        description: "RENDEZVÉNY\nKIVITELEZŐJE",
        primaryCtaLabel: "Kapcsolat",
        primaryCtaHref: "#contact",
        secondaryCtaLabel: "Szolgáltatások",
        secondaryCtaHref: "#services",
        heroImage: "",
        heroImages: [],
        imageDurationSeconds: 5,
        heroDurationSeconds: 6,
        heroSlides: [],
        badges: ["SAKKMED 2005 Kft."],
      },
    },
    {
      id: "services-sakkmed",
      type: "features",
      enabled: true,
      data: {
        title: "Szolgáltatásaink",
        subtitle: "Komplett rendezvénytechnika és műszaki háttér egy kézből",
        cards: [
          {
            title: "Rendezvény koordináció",
            description:
              "Események komplett műszaki felügyelete | Programszervezés, Booking | Party szervíz, Catering | Játékok | Fotózás, Videózás, drón",
            icon: "",
          },
          {
            title: "Rendezvénytechnika",
            description: "Hangtechnika | Fénytechnika | Látványtechnika | Színpadtechnika",
            icon: "",
          },
          {
            title: "Traverz és fedések",
            description:
              "Traverz rendszerek | Emeléstechnika | Layher rendszer | Fedések | Alutent sátrak",
            icon: "",
          },
          {
            title: "Installációk",
            description: "Kültéri installációk | Kiállítási kivitelezés",
            icon: "",
          },
          {
            title: "Bútorok és dekor",
            description: "Bútorok | Kapumegoldások | Textílek, dekorációk",
            icon: "",
          },
          {
            title: "Műszaki kivitelezés",
            description:
              "Egyedi installációk | Műszaki kivitelezés | Áramhálózat | Vízhálózat | Biztonságtechnika | Egészségügy | Mobil WC | Kordon, Kerítés",
            icon: "",
          },
        ],
      },
    },
    {
      id: "about-sakkmed",
      type: "about",
      enabled: true,
      data: {
        title: "Rólunk",
        paragraph: ABOUT_WHY,
        accordions: [
          { title: "Kik vagyunk?", content: ABOUT_WHO },
          { title: "Mit csinálunk?", content: ABOUT_WHAT },
          { title: "Hol vagyunk jelen?", content: ABOUT_WHERE },
          { title: "Miért érdemes minket választani?", content: ABOUT_WHY },
        ],
        cards: [
          { title: "15", description: "év tapasztalat" },
          { title: "5211", description: "rendezvény" },
          { title: "870", description: "ügyfél" },
          { title: "10M", description: "résztvevő" },
        ],
      },
    },
    {
      id: "projects-sakkmed",
      type: "gallery",
      enabled: true,
      data: {
        title: "Projektjeink",
        items: PROJECT_LINKS.map((p) => ({
          image: "/generic-hero.svg",
          caption: p.label,
        })),
      },
    },
    {
      id: "clients-sakkmed",
      type: "gallery",
      enabled: true,
      data: {
        title: "Ügyfeleink",
        items: [
          { image: "/generic-hero.svg", caption: "Partner" },
          { image: "/generic-hero.svg", caption: "Partner" },
          { image: "/generic-hero.svg", caption: "Partner" },
          { image: "/generic-hero.svg", caption: "Partner" },
        ],
      },
    },
    {
      id: "gallery-sakkmed",
      type: "gallery",
      enabled: true,
      data: {
        title: "Galéria",
        items: [
          { image: "/generic-hero.svg", caption: "Rendezvény" },
          { image: "/generic-hero.svg", caption: "Installáció" },
          { image: "/generic-hero.svg", caption: "Színpad" },
          { image: "/generic-hero.svg", caption: "VIP" },
          { image: "/generic-hero.svg", caption: "Fedés" },
          { image: "/generic-hero.svg", caption: "Technika" },
        ],
      },
    },
    {
      id: "contact-sakkmed",
      type: "contact",
      enabled: true,
      data: {
        title: "Kapcsolat",
        description:
          "Soroksári úti központi irodánkban ügyfélfogadás kizárólag előzetes időpontegyeztetés után lehetséges.",
        companyName: "SAKKMED 2005 Kft.",
        address: "1095 Budapest, Soroksári út 48.",
        phone: "",
        email: "balazs.gabor@esemenyszervezes.hu",
        sendButtonLabel: "Küldés",
        nameLabel: "Név",
        emailLabel: "E-mail",
        messageLabel: "Üzenet",
        warehouseTitle: "Raktár, árukiadás",
        warehouseBody:
          "1194 Budapest, Vásár tér 1.\nNyitvatartás: Hétfő – Péntek 7:15 – 15:15\nBencs János | Logisztikai vezető — bencs.janos@esemenyszervezes.hu\nTömöri Gyula | Technikai vezető — tomori.gyula@esemenyszervezes.hu",
        officeTaxId: "Adószám: 13543011-2-43",
        officeManagerLine: "Balázs Gábor | ügyvezető — balazs.gabor@esemenyszervezes.hu",
        btlBlock:
          "1095 Budapest, Soroksári út 48. · Adószám: 23729825-2-43\nKovács Henriette | ügyvezető — kovacs.henriette@esemenyszervezes.hu",
        financeBlock: "Marti Csillag | Pénzügyi vezető — marti.csillag@esemenyszervezes.hu",
        venueShort: "Raktár: 1194 Budapest, Vásár tér 1.",
        mapEmbedUrl:
          "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.5!2d19.089!3d47.46!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTA5NSBCdWRhcGVzdCwgU29yb2tz4bFpcmkgFLrSASA0OC4!5e0!3m2!1shu!2shu!4v1!5m2!1shu!2shu",
      },
    },
    {
      id: "service-links-sakkmed",
      type: "richText",
      enabled: true,
      data: {
        title: "",
        html: SERVICE_LINKS.map((l) => `<a href="${l.href}">${l.label}</a>`).join(" · "),
      },
    },
  ],
}

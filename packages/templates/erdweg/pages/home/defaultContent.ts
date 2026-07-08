import type { HomeContent } from "./schema"
import { MARQUEE_ITEMS } from "../../lib/constants"

const SERVICE_IMAGES = [
  "/templates/erdweg/service-residential.jpg",
  "/templates/erdweg/service-commercial.jpg",
  "/templates/erdweg/service-renovation.jpg",
  "/templates/erdweg/service-industrial.jpg",
]

export const homeDefaultContent: HomeContent = {
  meta: {
    seoTitle: "Erdweg — Építünk a tervek felett",
    seoDescription:
      "Építőipari családi vállalkozás — lakóépületek, kereskedelmi és ipari létesítmények, felújítások precíz kivitelezéssel.",
  },
  blocks: [
    {
      id: "hero-erdweg",
      type: "hero",
      enabled: true,
      data: {
        title: "Építünk",
        description: "a tervek felett.",
        primaryCtaLabel: "Munkáink",
        primaryCtaHref: "#projects",
        secondaryCtaLabel: "Ajánlatkérés",
        secondaryCtaHref: "#contact",
        heroImage: "/templates/erdweg/hero.jpg",
        heroImages: [],
        imageDurationSeconds: 5,
        heroDurationSeconds: 6,
        heroSlides: [],
        badges: ["1982 óta · Családi vállalkozás"],
      },
    },
    {
      id: "hero-lead-erdweg",
      type: "richText",
      enabled: true,
      data: {
        title: "",
        html: "Négy évtizedes szakmai tapasztalat — családi házak, irodák és ipari létesítmények, amelyek túlélik a terveket.",
      },
    },
    {
      id: "marquee-erdweg",
      type: "features",
      enabled: true,
      data: {
        title: "",
        subtitle: "",
        cards: MARQUEE_ITEMS.map((word) => ({ title: word, description: "", icon: "" })),
      },
    },
    {
      id: "label-services-erdweg",
      type: "divider",
      enabled: true,
      data: { label: "01 · Amit építünk" },
    },
    {
      id: "services-erdweg",
      type: "features",
      enabled: true,
      data: {
        title: "Négy szakterület.",
        subtitle: "Egy minőség.",
        cards: [
          {
            title: "Lakóépület",
            description:
              "Egyedi családi házak alapoktól a kulcsátadásig. Egy projektvezető, végig követhető ütemterv.",
            icon: SERVICE_IMAGES[0],
          },
          {
            title: "Kereskedelmi",
            description:
              "Irodatoronyok, kiskereskedelem és vendéglátás. Határidőre, tiszta építési terület minden héten.",
            icon: SERVICE_IMAGES[1],
          },
          {
            title: "Felújítás",
            description:
              "Használatban lévő épületek precíz beavatkozása. Régi csontváz, új funkciók — a karakter megőrzésével.",
            icon: SERVICE_IMAGES[2],
          },
          {
            title: "Ipari",
            description:
              "Raktárak, gyárcsarnokok és logisztikai központok. Nehéz acél, gyors ciklusok, auditált biztonság.",
            icon: SERVICE_IMAGES[3],
          },
        ],
      },
    },
    {
      id: "services-intro-erdweg",
      type: "richText",
      enabled: true,
      data: {
        title: "",
        html: "Minden projekt — a kerti vendégházaktól a 40 000 m²-es logisztikai központokig — ugyanazon az elven fut: egy felelős projektvezető, átlátható költségvetés, heti helyszíni egyeztetés.",
      },
    },
    {
      id: "label-about-erdweg",
      type: "divider",
      enabled: true,
      data: { label: "02 · Kik vagyunk" },
    },
    {
      id: "about-erdweg",
      type: "about",
      enabled: true,
      data: {
        title:
          "Családi vállalkozás, amely kalapáccsal tanulta a szakmát, majd tervrajzokkal érdemelte ki a hírnevét. A nehéz munkát nem adjuk alvállalkozóknak.",
        paragraph:
          "1982-ben alapítottuk, ma már a második generáció vezeti a csapatot. 86 saját szakember — kőműves, hegesztő, ács, projektmenedzser — dolgozik egy szabály szerint: az épület jobb legyen, mint amit vártál, és pontosan a megbeszélt napon.",
        accordions: [],
        cards: [
          { title: "42", description: "Év tapasztalat" },
          { title: "318", description: "Projekt" },
          { title: "97%", description: "Határidőre" },
          { title: "0", description: "Baleset '24-ben" },
        ],
      },
    },
    {
      id: "label-projects-erdweg",
      type: "divider",
      enabled: true,
      data: { label: "03 · Kiemelt munkák" },
    },
    {
      id: "projects-erdweg",
      type: "gallery",
      enabled: true,
      data: {
        title: "Legutóbbi projektek.",
        items: [
          { image: "/templates/erdweg/project-1.jpg", caption: "Hillcrest Residence · Lakó · 2024" },
          { image: "/templates/erdweg/project-2.jpg", caption: "Lumen Tower · Kereskedelmi · 2023" },
          { image: "/templates/erdweg/project-3.jpg", caption: "Alpine Retreat · Vendéglátás · 2023" },
        ],
      },
    },
    {
      id: "projects-cta-erdweg",
      type: "cta",
      enabled: true,
      data: {
        title: "",
        description: "",
        primaryLabel: "Teljes archívum →",
        primaryHref: "#contact",
        secondaryLabel: "",
        secondaryHref: "",
        variant: "muted",
      },
    },
    {
      id: "label-references-erdweg",
      type: "divider",
      enabled: true,
      data: { label: "04 · Referenciák" },
    },
    {
      id: "references-erdweg",
      type: "testimonials",
      enabled: true,
      data: {
        title: "Mit mondanak ügyfeleink az átadás után.",
        subtitle: "",
        items: [
          {
            quote:
              "Az Erdweg hat héttel korábban adta át a székhelyünket. A kivitelezés minőségéről még ma is beszélnek a vezetőségi üléseken.",
            name: "Helena Voss",
            role: "COO, Northbound Capital",
            rating: 5,
          },
          {
            quote:
              "Egy 1908-as raktárt újítottak fel anélkül, hogy elveszítette volna a lelkét. Mérnöki precizitás és tisztelet egyensúlyban.",
            name: "Marco Reyes",
            role: "Principal, Reyes Architects",
            rating: 5,
          },
          {
            quote:
              "Három projekt után még sosem csúsztunk. Úgy építenek, mintha a sajátjuk lenne az épület.",
            name: "Sara Lindqvist",
            role: "Director, Atelier Nord",
            rating: 5,
          },
        ],
      },
    },
    {
      id: "label-contact-erdweg",
      type: "divider",
      enabled: true,
      data: { label: "05 · Projekt indítása" },
    },
    {
      id: "contact-erdweg",
      type: "contact",
      enabled: true,
      data: {
        title: "Mondd el, mit",
        companyName: "építeni.",
        description:
          "Minden megkeresést 24 órán belül elolvas egy senior partner. Nincs chatbot — csak telefonhívás vagy helyszíni egyeztetés.",
        address: "318 Foundry Lane, Denver CO",
        phone: "+1 (303) 555-0142",
        email: "hello@erdweg.example",
        sendButtonLabel: "Ajánlatkérés",
        nameLabel: "Név",
        emailLabel: "E-mail",
        messageLabel: "Projekt részletei",
        warehouseTitle: "",
        warehouseBody: "",
        officeTaxId: "",
        officeManagerLine: "",
        btlBlock: "",
        financeBlock: "",
        venueShort: "",
        mapEmbedUrl: "",
      },
    },
  ],
}

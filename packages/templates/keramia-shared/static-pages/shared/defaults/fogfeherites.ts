import type { CampaignPageContent } from "../schema"
import {
  KERAMIA_ADDRESS,
  KERAMIA_PHONE,
  KERAMIA_PROMO_PERIOD_HU,
} from "../../../lib/constants"

/** Default copy from keramiadental_fogfeherites/site (data.ts + App.tsx). */
export const fogfeheritesDefault: CampaignPageContent = {
  locale: "hu",
  hero: {
    badge: KERAMIA_PROMO_PERIOD_HU,
    title: "Ragyogó, fehér mosoly egyetlen óra alatt",
    tagline: "Fogfehérítés + fogkőleszedés most 10% + 10% kedvezménnyel.",
    subtitle:
      "Egy alapos ultrahangos fogkőleszedés, majd hidegfényű klinikai fogfehérítés — egyetlen kényelmes ülésben. Az eredmény akár 5–8 árnyalattal fehérebb, egészséges mosoly. Mindkét kezelés árából 10–10% kedvezményt adunk.",
    promoHighlight: "10% + 10%",
    promoSubtext: "kedvezmény\na két kezelésre",
    ctaLabel: "Kérek időpontot",
    phone: KERAMIA_PHONE,
    location: KERAMIA_ADDRESS,
    image: "/templates/keramia-shared/campaign-fogfeherites.jpg",
  },
  benefits: [
    {
      title: "Akár 5–8 árnyalat",
      description: "Látványosan világosabb mosoly már egyetlen rendelői kezelés alatt.",
    },
    {
      title: "Kb. 1 óra alatt",
      description: "A fogkőleszedés és a fehérítés egyetlen kényelmes ülésben.",
    },
    {
      title: "Kíméletes, fájdalommentes",
      description: "Érzéstelenítés nélkül, a fogíny egészségét is helyreállítva.",
    },
    {
      title: "Biztonságos eljárás",
      description: "Nem károsítja a zománcot, a töméseket és a koronákat.",
    },
  ],
  offer: {
    eyebrow: "AZ AKCIÓRÓL",
    title: "Két kezelés, egy ragyogó eredmény",
    body:
      "A professzionális fogfehérítés alapfeltétele a tiszta, fogkőmentes fogazat — ezért kezeljük a kettőt együtt. A kezelés egy alapos ultrahangos fogkőleszedéssel és sópolírozással indul, amely a legmakacsabb elszíneződéseket is eltávolítja.\n\nEzt követi a klinikai fogfehérítés, ahol speciális gélt és hidegfényű lámpát használunk a zománc kíméletes, de látványos világosítására. Mindössze egy óra alatt több árnyalattal fehérebb mosoly — miközben a fogíny egészségét is helyreállítjuk.",
    bullets: [
      "Ultrahangos fogkőleszedés és sópolírozás a tiszta alapért",
      "Hidegfényű LED-lámpás Opalescence fogfehérítés",
      "Akár 5–8 árnyalatnyi világosodás egyetlen ülésben",
      "A fogíny egészségét is helyreállítjuk",
      "Mindkét kezelés árából 10–10% kedvezmény",
    ],
    discounts: [
      { value: "−10%", label: "Fogkőleszedés" },
      { value: "−10%", label: "Fogfehérítés" },
    ],
    footnotes: [
      "Az akció 2026. június 1. – augusztus 31. között érvényes.",
      "A kedvezmény kizárólag online jelentkezés esetén érvényes.",
    ],
  },
  process: {
    eyebrow: "A KEZELÉS MENETE",
    title: "Így zajlik a kezelés",
    subtitle:
      "Három egyszerű, egymásra épülő lépés — egyetlen, kényelmes ülésben, nagyjából két óra alatt.",
    steps: [
      {
        number: "01",
        title: "Fogkőleszedés & polírozás",
        description:
          "Ultrahangos depurátorral eltávolítjuk a fogkövet és a lepedéket, majd sópolírozással a legmakacsabb elszíneződéseket is — így a zománc tökéletesen tiszta a fehérítéshez.",
        duration: "~20–50 perc",
      },
      {
        number: "02",
        title: "Hidegfényű LED fehérítés",
        description:
          "A fogínyt gondosan izoláljuk, felvisszük a professzionális Opalescence fehérítő gélt, majd hidegfényű LED-lámpával kíméletesen, de látványosan világosítjuk a zománcot.",
        duration: "~45–60 perc",
      },
      {
        number: "03",
        title: "Ragyogó, fehér mosoly",
        description:
          "Az ülés végén akár 5–8 árnyalattal fehérebb, egészséges és fogkőmentes mosoly vár — azonnal látható, természetes eredménnyel.",
        duration: "azonnali eredmény",
      },
    ],
  },
  services: {
    eyebrow: "KEZELÉSEINK",
    title: "Fehérítés és fogtisztítás a Kerámia Dentalnál",
    subtitle:
      "Az akció a rendelői fogfehérítésre és az ultrahangos fogkőleszedésre vonatkozik — de igény szerint kiegészítő és otthoni megoldásokat is kínálunk.",
    items: [
      {
        badge: "AKCIÓS −10%",
        title: "Ultrahangos fogkőleszedés",
        description:
          "Az akció első lépése: ultrahangos depurátorral távolítjuk el a fogkövet és a lepedéket, majd tükörsimára polírozzuk a fogakat.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "AKCIÓS −10%",
        title: "Rendelői LED fogfehérítés",
        description:
          "Opalescence Boost peroxidos gél és hidegfényű LED-lámpa: gyors, látványos, akár 5–8 árnyalatnyi világosodás.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "ALTERNATÍVA",
        title: "Otthoni fogfehérítés",
        description:
          "Egyedi fehérítő sín és Opalescence gél: a legkíméletesebb módszer, amellyel otthon, saját tempóban világosíthat.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "KIEGÉSZÍTŐ",
        title: "Homokfúvásos fogtisztítás",
        description:
          "Ízesített tisztítóporral és nagynyomású vízsugárral távolítjuk el a legapróbb elszíneződéseket és a makacs lepedéket is.",
        ctaLabel: "Időpontot kérek",
      },
    ],
  },
  beforeAfter: {
    eyebrow: "AZ EREDMÉNY",
    title: "Akár 5–8 árnyalattal fehérebb",
    beforeLabel: "Előtte",
    afterLabel: "Utána",
    caption: "Húzza a csúszkát az összehasonlításhoz · illusztráció",
    beforeImage: "",
    afterImage: "",
  },
  results: {
    eyebrow: "AZ EREDMÉNY",
    title: "Akár 5–8 árnyalattal fehérebb",
    body:
      "A rendelői, LED-lámpás Opalescence Boost fehérítés a bizonyítottan leghatásosabb módszer: a hatás azonnal látható, és szakszerűen végezve nem károsítja a zománcot.",
    stats: [],
    items: [
      {
        category: "FEHÉRÍTÉS",
        title: "Ragyogóan fehér mosoly",
        description:
          "Akár 5–8 árnyalattal világosabb fogak, azonnal látható, természetes eredménnyel.",
      },
      {
        category: "EGÉSZSÉG",
        title: "Fogkőmentes, egészséges íny",
        description: "Eltávolítjuk a fogkövet és a lepedéket, helyreállítva a fogíny egészségét.",
      },
      {
        category: "TISZTASÁG",
        title: "Tükörsima fogfelszín",
        description: "A polírozott zománcon lassabban tapad meg az új lepedék és fogkő.",
      },
      {
        category: "ÖNBIZALOM",
        title: "Magabiztosság, friss lehelet",
        description: "Egy ragyogó mosoly, amely önbizalmat ad — és tartósan friss érzést.",
      },
    ],
  },
  why: {
    eyebrow: "MIÉRT EZ A SORREND?",
    title: "Miért előzi meg a fogkőleszedés a fehérítést?",
    tip:
      "TIPP: A professzionális fogtisztítást a legideálisabb esetben is érdemes évente kétszer elvégeztetni.",
    body:
      "A fogkő és a lepedék nemcsak esztétikai gond: fogínygyulladást, ínyvérzést, hosszú távon akár a fogak meglazulását is okozhatja. A tiszta, fogkőmentes felületen pedig a fehérítő gél egyenletesen és látványosan tud hatni — ezért a kettő együtt a leghatékonyabb.",
    bullets: [
      "A fogfehérítés alapfeltétele a tiszta, fogkőmentes fogazat — a gél csak így tud egyenletesen hatni.",
      "A fogkő fogínygyulladást, ínyvérzést és hosszú távon a fogak meglazulását okozhatja.",
      "A lepedék és a fogkő elszíneződést, esztétikai problémát és kellemetlen leheletet okoz.",
      "A tisztítás után a zománc valódi színe látszik — a fehérítés így sokkal látványosabb.",
      "A tükörsimára polírozott fogfelszínen lassabban tapad meg az új lepedék és fogkő.",
      "Egymásra épülő kezelésként, egyetlen ülésben a leghatékonyabb és a legkényelmesebb.",
    ],
  },
  faq: {
    eyebrow: "GYAKORI KÉRDÉSEK",
    title: "Amit a kezelésről tudni érdemes",
    items: [
      {
        question: "Miért kell a fehérítés előtt fogkőleszedés?",
        answer:
          "A fehérítő gél csak tiszta, fogkőmentes felületen tud egyenletesen hatni. A fogkőleszedés és a polírozás eltávolítja a lepedéket és a makacs elszíneződéseket, így a fehérítés látványosabb és tartósabb lesz. Pontosan ezért építjük egymásra a két kezelést egyetlen, kényelmes ülésben.",
      },
      {
        question: "Fájdalmas a kezelés?",
        answer:
          "Nem. Az ultrahangos fogkőleszedéshez az esetek túlnyomó többségében nincs szükség érzéstelenítésre, a kezelés nem jár fájdalommal. A fehérítés is kíméletes — néhányan átmeneti, enyhe fogérzékenységet tapasztalhatnak utána, ami rövid időn belül elmúlik.",
      },
      {
        question: "Mennyi ideig tart a teljes kezelés?",
        answer:
          "A fogkőleszedés általában 20–50 perc, a rendelői LED fehérítés pedig kb. 1–1,5 óra. Az akciós csomag így jellemzően egyetlen, nagyjából kétórás ülésben kényelmesen elvégezhető.",
      },
      {
        question: "Mennyivel lesznek fehérebbek a fogaim?",
        answer:
          "A rendelői, LED-lámpás Opalescence Boost fehérítéssel akár 5–8 árnyalatnyi világosodás is elérhető. A pontos eredményt a fogak kiindulási állapota, az életmód és a fogak egyéni adottságai is befolyásolják.",
      },
      {
        question: "Meddig tart az eredmény, és ismételhető?",
        answer:
          "A megfelelő szájhigiéniával és a kávé, tea, dohányzás mérséklésével a fehérítés hatása hónapokig, akár 1–2 évig is megmarad. A rendelői fehérítés 6 havonta biztonságosan ismételhető, a professzionális fogtisztítást pedig évente kétszer javasoljuk.",
      },
      {
        question: "Kinek nem ajánlott a fogfehérítés?",
        answer:
          "Várandós és szoptató kismamáknak, 16 év alattiaknak, valamint kezeletlen szuvasodás vagy súlyos fogínygyulladás esetén a fehérítést a kezelések rendezéséig nem javasoljuk. Egy rövid konzultáción minden esetben felmérjük, hogy Önnek megfelelő-e a kezelés.",
      },
    ],
  },
  ctaBand: {
    title: "Kezdje a nyarat ragyogó mosollyal!",
    subtitle:
      "Foglaljon időpontot a fogfehérítés + fogkőleszedés akcióra, és élvezze a 10% + 10% kedvezményt.",
    bullets: [
      "Az akció 2026. június 1. – augusztus 31. között érvényes",
      "Kizárólag online jelentkezés esetén",
    ],
    ctaLabel: "Kérek időpontot",
  },
  contact: {
    eyebrow: "KAPCSOLAT",
    title: "Foglaljon időpontot az akcióra",
    subtitle:
      "Hagyja meg elérhetőségét, és munkatársunk hamarosan visszahívja az időpont egyeztetéséhez. Telefonon is várjuk hívását.",
    nameLabel: "Teljes név",
    phoneLabel: "Telefonszám",
    emailLabel: "E-mail cím",
    interestLabel: "Mire szeretne időpontot?",
    messageLabel: "Megjegyzés (opcionális)",
    privacyText:
      "Az adatkezelési tájékoztatót elolvastam és elfogadom, hozzájárulok adataim kezeléséhez a kapcsolatfelvétel céljából.",
    submitLabel: "Jelentkezés elküldése",
    interestOptions: [
      { value: "akcios-csomag", label: "Akciós csomag (fogkőleszedés + fehérítés)" },
      { value: "fogkoleszedes", label: "Ultrahangos fogkőleszedés" },
      { value: "led-feherites", label: "Rendelői LED fogfehérítés" },
      { value: "otthoni-feherites", label: "Otthoni fogfehérítés" },
      { value: "egyeb", label: "Egyéb / konzultáció" },
    ],
  },
  meta: {
    seoTitle: "Fogfehérítés + fogkőleszedés akció | Kerámia Dental Székesfehérvár",
    seoDescription:
      "Fogfehérítés és fogkőleszedés akció a Kerámia Dentalnál Székesfehérváron – most 10% + 10% kedvezménnyel. Akár 5–8 árnyalattal fehérebb mosoly egyetlen óra alatt.",
  },
}

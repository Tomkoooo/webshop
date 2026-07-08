import type { HomeContent } from "./schema"
import { mineshowFaqItems } from "../../content/mineshow-faq"
import {
  KOCKAKEMP_COMPANY_NAME,
  MINECRAFT_CAMP_FACEBOOK_EVENT_URL,
} from "../../lib/constants"

const DEFAULT_MAP_EMBED =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d16512.43395838978!2d19.072352850677607!3d47.50229386689003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4741dc85dbc2eaf5%3A0x4ae6f260ce6f87bf!2sR%C3%A9csei%20Center!5e0!3m2!1shu!2shu!4v1777970244559!5m2!1shu!2shu"

const CONTACT_EMAIL = "tabor@kockakemp.hu"

/** Marketing copy from https://mineshow.hu/tabor — camp booking dates/tickets are configured in admin/seed separately. */
const STORY_PARAGRAPH = `Napközis programozótábort indítunk, ahol a délelőttök a programozásról és alkotásról, a délutánok pedig a közös játékról szólnak – a szabadban és az online térben egyaránt, izgalmas, Minecraft-alapú party játékokkal.

Júliusban és augusztusban várjuk a 6–12 éves gyerekeket heti turnusokban, Budapesten, a 14. kerületi Récsei Centerben. A bejárós tábor során minden résztvevő a saját laptopján tanulja meg a Minecraft-modkészítés alapjait. A gyerekek modellező program segítségével új karaktereket alkotnak, megismerkednek pályageneráló eszközökkel, valamint belekóstolnak egy kifejezetten Minecraft-hoz optimalizált animációs programba is, amelyben saját kisfilmeket készítenek.

A gyerekek nemcsak csapatban tanulnak együttműködni, hanem önálló programozási készségeiket is fejlesztik. Délutánonként – a szabadtéri és sportprogramok mellett – MiniGame partykkal készülünk: lesz építőverseny, PvP-alapú harc, akadálypálya és túlélő kihívás is.

Célunk, hogy a nyári szünet ne csak szórakoztató, hanem hasznos is legyen.

Sztárvendégünk zsDav, aki a hét zárásaként egy játékos kvízzel méri fel a megszerzett tudást, emellett fotózásra és dedikálásra is lehetőség lesz.

Jelentkezz még ma, ne maradj le az élményről!`

const PRICING_PARAGRAPH = `A heti turnus 75 000 Ft-ba kerül gyerekenként. A testvéreknek 10% kedvezményt biztosítunk a normál jegyárból.

Június első hetében early bird kedvezménnyel 67 500 FT áron lehet jelentkezni. Jelentkezz még ma, ne maradj le az élményről!

Amennyiben szükséged van rá, tudsz tőlünk a turnus idejére laptopot kölcsönözni. Ezt a jegyek között 10 000 Ft/hét értékben megtalálod.

Lemondás esetén jegy árát 100%-ban visszafizetjük, a turnus előtt 2 héttel. Azt követően, a turnus kezdéséig a befizetett összeg 50%-át, a turnus alatt pedig a fennmaradó napok 30%-át.`

const PROGRAMS_HTML =
  "Meet & Greet zsDavval, Build Battle, Speed builedrs, BlockBench, Bedwars, Death Run, World Painter, Splegg, Guess my drawing, Mine lmator, Murder Mystery, Impostor Builders, Kahoot, UHC, Bingo survival, MINIGAME Party!"

export const homeDefaultContent: HomeContent = {
  meta: {
    seoTitle: "KockaKemp tábor | Minecraft napközis tábor Budapest",
    seoDescription:
      "KockaKemp — Minecraft nyári tábor zsDavval a Récsei Centerben. Programozás, MiniGame party, jelentkezés online.",
  },
  blocks: [
    {
      id: "hero-mineshow",
      type: "hero",
      enabled: true,
      data: {
        title: "",
        description: "",
        primaryCtaLabel: "Jelentkezés",
        primaryCtaHref: "/jegyvasarlas",
        secondaryCtaLabel: "",
        secondaryCtaHref: "",
        heroImage: "/generic-hero.svg",
        heroImages: ["/generic-hero.svg"],
        imageDurationSeconds: 4,
        heroDurationSeconds: 6,
        heroSlides: [],
        badges: ["Récsei Center, 2026 nyár"],
      },
    },
    {
      id: "story-zsdav",
      type: "about",
      enabled: true,
      data: {
        title: "Mineshow tábor zsDavval Budapesten",
        paragraph: STORY_PARAGRAPH,
        image: "/generic-hero.svg",
        boxHeading: "Alkoss, játssz, programozz!",
        ctaLabel: "Jelentkezés",
        ctaHref: "/jegyvasarlas",
        bannerText: "Jelezd, hogy ott leszel, értesülj a friss infókról",
        bannerHref: MINECRAFT_CAMP_FACEBOOK_EVENT_URL,
        accordions: [],
        cards: [],
      },
    },
    {
      id: "programs-intro",
      type: "richText",
      enabled: true,
      data: {
        title: "",
        html: PROGRAMS_HTML,
      },
    },
    {
      id: "programs-gallery",
      type: "gallery",
      enabled: true,
      data: {
        title: "Programok",
        items: [
          { image: "/generic-hero.svg", caption: "Bedwars" },
          { image: "/generic-hero.svg", caption: "Murder Mystery" },
          { image: "/generic-hero.svg", caption: "Mine-imator" },
          { image: "/generic-hero.svg", caption: "Build Battle" },
          { image: "/generic-hero.svg", caption: "UHC verseny" },
          { image: "/generic-hero.svg", caption: "Death Run" },
        ],
      },
    },
    {
      id: "pricing-info",
      type: "about",
      enabled: true,
      data: {
        title: "Árak és fizetés",
        paragraph: PRICING_PARAGRAPH,
        accordions: [],
        cards: [],
      },
    },
    {
      id: "faq-mineshow",
      type: "about",
      enabled: true,
      data: {
        title: "Gyakori Kérdések",
        paragraph: "",
        accordions: [...mineshowFaqItems],
        cards: [],
      },
    },
    {
      id: "contact-venue",
      type: "contact",
      enabled: true,
      data: {
        title: "Récsei Center, 1146 Budapest, Istvánmezei út 6.",
        description: "",
        companyName: KOCKAKEMP_COMPANY_NAME,
        address: "Récsei Center, 1146 Budapest, Istvánmezei út 6.",
        venueShort: "Récsei Center, 2026 nyár",
        mapEmbedUrl: DEFAULT_MAP_EMBED,
        phone: "",
        email: CONTACT_EMAIL,
      },
    },
  ],
}

#!/usr/bin/env npx tsx
/**
 * Seed Hungarian (`hu`) content for World Darts Festival, additive only.
 *
 * Writes NEW documents keyed `page:home@hu`, `page:fontos-informaciok@hu`, and
 * `footer:world-darts-festival@hu` — translations of the real, currently-live English
 * content. Never reads-then-overwrites the existing English `page:home`,
 * `page:fontos-informaciok`, or `footer:world-darts-festival` documents, and never touches
 * any other collection (media, products, tbookevents, ...).
 *
 * Usage:
 *   WDF_SEED_DB_URL="mongodb://host:port/world-darts-festival" npx tsx scripts/seed/wdf-i18n-seed.ts
 *
 * Falls back to swapping the db name on DATABASE_URL to "world-darts-festival" when
 * WDF_SEED_DB_URL is not set (same host, different db — confirmed with the customer).
 * Deliberately ignores SEED_DB_URL: that variable points at an unrelated customer's
 * database (nagyarcu) in this repo's .env, not WDF's — using it here would silently
 * write to the wrong cluster.
 */
import "dotenv/config"
import mongoose from "mongoose"
import TemplateContent from "@wse/core/models/TemplateContent"
import FooterSetting from "@wse/core/models/FooterSetting"
import { backupCollectionsBeforeSeed } from "./lib/safe-seed-backup"

const TEMPLATE_ID = "world-darts-festival"
const LOCALE = "hu"

function resolveUri(): string {
  if (process.env.WDF_SEED_DB_URL) return process.env.WDF_SEED_DB_URL
  const base = process.env.DATABASE_URL
  if (!base) {
    throw new Error("WDF_SEED_DB_URL or DATABASE_URL required")
  }
  return base.replace(/\/[^/?]+(\?|$)/, "/world-darts-festival$1")
}

// Translated 1:1 from the live English `page:home` document (pulled 2026-07-29).
const homeContentHu = {
  chrome: {
    nav: [
      { type: "link", label: "Információk", href: "/fontos-informaciok" },
      { type: "link", label: "Helyszín", href: "/#venue" },
      { type: "link", label: "Program", href: "/#schedule" },
      { type: "link", label: "Kapcsolat", href: "/#contact" },
      { type: "link", label: "Díjazás", href: "#prize-money" },
    ],
    navCta: {
      enabled: true,
      label: "Nevezés és foglalás",
      mobileLabel: "Nevezés és foglalás",
      href: "/jegyek",
      showIcon: true,
    },
    tbookApiKey: "tbk_9a5aee029ba68fe14639741385d14c54fa8565a909e7f122",
  },
  sectionLayout: [
    { id: "hero", enabled: true },
    { id: "festival", enabled: true },
    { id: "infoCards", enabled: true },
    { id: "venue", enabled: true },
    { id: "schedule", enabled: true },
    { id: "fees", enabled: false },
    { id: "prizeMoney", enabled: true },
    { id: "sponsors", enabled: true },
    { id: "contact", enabled: true },
  ],
  hero: {
    tagline: "World Darts Festival 2026 — Budapest, Magyarország",
    title: "Üdvözlünk a World Darts Festivalon",
    subtitle:
      "Csatlakozz hozzánk, és légy tanúja a leendő legendák születésének a darts egyik legrangosabb versenyén — izgalmas mérkőzések, világklasszis tehetségek és felejthetetlen fesztiválhangulat.",
    heroImage: "/api/media/99b3feb9-ad75-496e-a585-dc4eca121c27.jpg",
    primaryCtaLabel: "Foglalás és nevezés",
    primaryCtaHref: "/jegyek",
    secondaryCtaLabel: "Díjazás",
    secondaryCtaHref: "#prize-money",
  },
  festival: {
    title: "2026 World Darts Festival",
    body:
      "A korábbi évek sikerét követően Magyarország ismét egy izgalmas, világklasszis darts-hetet ad otthont. Ezúttal a Hungarian Open és a Champions League döntője kerül a középpontba, összehozva a világ élvonalbeli játékosait egy felejthetetlen versenyen.\n\nÜdvözlünk a World Darts Festivalon — a darts 5 napos, akciódús ünnepén, ahol élvonalbeli versenyzés, hihetetlen hangulat és felejthetetlen pillanatok várnak!",
    image: "/api/media/47e84eb8-ec05-428b-8b45-f74d8291656e.jpg",
    ctaLabel: "Foglalás és nevezés",
    ctaHref: "/jegyek",
  },
  infoCards: [
    {
      title: "Fontos információk",
      body: "Olvasd el a nevezéssel, szabályokkal és a játékformátummal kapcsolatos részletes tudnivalókat. Minden, amit tudnod kell, egy kattintásra van.",
      ctaLabel: "Tovább olvasom",
      ctaHref: "/fontos-informacio",
    },
    {
      title: "Rajta vagy a listán? - Champions League",
      body: "Nézd meg a hivatalos nevezési listákat, és győződj meg róla, hogy a csapatod szerepel rajtuk.",
      ctaLabel: "Keresd meg a csapatod",
      ctaHref: "/jegyek",
    },
  ],
  venue: {
    heading: "Helyszín",
    name: "Gerevich Aladár Nemzeti Sportcsarnok",
    body:
      "Budapest szívében található a Gerevich Aladár Nemzeti Sportcsarnok, amely elsőrangú helyszínt biztosít sportolóknak és szurkolóknak egyaránt. \nA legendás magyar vívóról elnevezett létesítmény számos hazai és nemzetközi rendezvénynek ad otthont.",
    accessHeading: "Könnyű megközelíthetőség",
    accessBody:
      "A városközponthoz közel elhelyezkedő csarnok könnyen megközelíthető tömegközlekedéssel, busszal, villamossal és metróval egyaránt.",
    mapLabel: "Mutasd a térképen",
    mapHref:
      "https://www.google.com/maps/place/Nemzeti+Sportk%C3%B6zpontok/@47.5027578,19.090273,17z/data=!3m1!4b1!4m6!3m5!1s0x4741dc85c16829fd:0x3ddfb8d7c09f8f2e!8m2!3d47.5027542!4d19.0928479!16s%2Fg%2F11c54cc93c?entry=ttu&g_ep=EgoyMDI2MDcxMi4wIKXMDSoASAFQAw%3D%3D",
    mapEmbedUrl: "",
    image: "/api/media/ae99a02d-424e-4a78-a152-40bdcec09bad.jpg",
  },
  schedule: {
    heading: "Program",
    days: [
      {
        date: "Október 21. — szerda",
        title: "Champions League",
        items: ["11:00 - Champions League - Alapszakasz"],
      },
      {
        date: "Október 22. — csütörtök",
        title: "Champions League",
        items: ["11:00 - Champions League - Elődöntők", "14:00 - Champions League - Döntő"],
      },
      {
        date: "Október 23. — péntek",
        title: "Hungarian Open Steel Grand Prix - Bronz",
        items: ["11:00 - Hungarian Open Steel Grand Prix", "Open, Nők, Ifjúsági, Lányok"],
      },
      {
        date: "Október 23. — péntek",
        title: "Hungarian Open Páros",
        items: ["18:00 - Hungarian Open Páros"],
      },
      {
        date: "Október 24. — szombat",
        title: "Hungarian Open Steel Classic - Ezüst",
        items: ["10:00 - Hungarian Open Steel Classic", "Open, Nők, Ifjúsági, Lányok"],
      },
      {
        date: "Október 24. — szombat",
        title: "World Paradarts Hungarian Masters",
        items: ["15:00 - World Paradarts Hungarian Masters", "Álló, Kerekesszékes"],
      },
      {
        date: "Október 24. — szombat",
        title: "Hungarian Open Soft",
        items: ["18:00 - Hungarian Open Soft", "18:00 - Hungarian Open Soft Páros"],
      },
      {
        date: "Október 25. — vasárnap",
        title: "Hungarian Open Steel Masters - Arany",
        items: ["10:00 - Hungarian Open Steel Masters", "Open, Nők, Ifjúsági, Lányok"],
      },
      {
        date: "Október 25. — vasárnap",
        title: "World Paradarts Hungarian Classic",
        items: ["15:00 - World Paradarts Hungarian Classic", "Álló, Kerekesszékes"],
      },
    ],
  },
  fees: {
    heading: "Nevezési és adminisztrációs díjak",
    items: [] as Array<{ label: string; price: string; badge: string }>,
    ctaLabel: "Nevezz most",
    ctaHref: "/jegyek",
  },
  prizeMoney: {
    heading: "Díjazás",
    intro: "A World Darts Festival egyes versenyeinek díjtáblázatai.",
    tables: [
      {
        title: "Champions League",
        subtitle: "Teljes díjazás: €10000",
        headers: ["Helyezés", "Csapat", "", ""],
        rows: [
          ["Győztes", "€5,000", "", ""],
          ["Döntős", "€3,000", "", ""],
          ["Elődöntős", "€2,000", "", ""],
        ],
      },
      {
        title: "Hungarian Open Steel Grand Prix - Bronz",
        subtitle: "Teljes díjazás: €2600",
        headers: ["Helyezés", "Open", "Nők", "Ifjúsági", "Lányok"],
        rows: [
          ["Győztes", "€560", "€280", "€80", "€40"],
          ["Döntős", "€280", "€140", "€40", "€20"],
          ["Elődöntős", "€140", "€70", "€20", ""],
          ["Negyeddöntős", "€70", "€35", "", ""],
          ["Legjobb 16", "€35", "", "", ""],
        ],
      },
      {
        title: "Hungarian Open - Páros",
        subtitle: "Teljes díjazás: €1940",
        headers: ["Helyezés", "Open", "Nők", "Ifjúsági", "Lányok"],
        rows: [
          ["Győztes", "€500", "€250", "€120", "€60"],
          ["Döntős", "€240", "€120", "€60", ""],
          ["Elődöntős", "€120", "€60", "", ""],
          ["Negyeddöntős", "€60", "", "", ""],
        ],
      },
      {
        title: "Hungarian Open Steel Classic - Ezüst",
        subtitle: "Teljes díjazás: €8440",
        headers: ["Helyezés", "Open", "Nők", "Ifjúsági", "Lányok"],
        rows: [
          ["Győztes", "€1600", "€800", "€160", "€80"],
          ["Döntős", "€800", "€400", "€80", "€40"],
          ["Elődöntős", "€400", "€200", "€80", "€20"],
          ["Negyeddöntős", "€200", "€100", "", ""],
          ["Legjobb 16", "€100", "€50", "", ""],
          ["Legjobb 32", "€50", "", "", ""],
        ],
      },
      {
        title: "Hungarian Open Steel Masters - Arany",
        subtitle: "Teljes díjazás: €17000",
        headers: ["Helyezés", "Open", "Nők", "Fiúk", "Lányok"],
        rows: [
          ["Győztes", "€2600", "€1300", "€250", "€120"],
          ["Döntős", "€1300", "€650", "€120", "€60"],
          ["Elődöntős", "€650", "€350", "€60", "€30"],
          ["Negyeddöntős", "€350", "€175", "€30", ""],
          ["Legjobb 16", "€175", "€100", "", ""],
          ["Legjobb 32", "€100", "€50", "", ""],
          ["Legjobb 64", "€50", "", "", ""],
        ],
      },
      {
        title: "World Paradarts Hungarian Masters",
        subtitle: "Teljes díjazás: €1460",
        headers: ["Helyezés", "Kerekesszékes", "Álló"],
        rows: [
          ["Győztes", "€300", "€300"],
          ["Döntős", "€150", "€150"],
          ["Elődöntős", "€70", "€70"],
          ["Negyeddöntős", "€35", "€35"],
        ],
      },
      {
        title: "World Paradarts Hungarian Classic",
        subtitle: "Teljes díjazás: €1460",
        headers: ["Helyezés", "Kerekesszékes", "Álló"],
        rows: [
          ["Győztes", "€300", "€300"],
          ["Döntős", "€150", "€150"],
          ["Elődöntős", "€70", "€70"],
          ["Negyeddöntős", "€35", "€35"],
        ],
      },
      {
        title: "Hungarian Soft Open",
        subtitle: "Teljes díjazás: €1700",
        headers: ["Helyezés", "Open", "Nők"],
        rows: [
          ["Győztes", "€500", "€250"],
          ["Döntős", "€240", "€120"],
          ["Elődöntős", "€120", "€60"],
          ["Negyeddöntős", "€60", ""],
        ],
      },
      {
        title: "Hungarian Soft Open - Páros",
        subtitle: "Teljes díjazás: €1700",
        headers: ["Helyezés", "Open", "Nők"],
        rows: [
          ["Győztes", "€500", "€250"],
          ["Döntős", "€240", "€120"],
          ["Elődöntős", "€120", "€60"],
          ["Negyeddöntős", "€60", ""],
        ],
      },
      {
        title: "Nine-Dart Finish bónusz",
        subtitle: "",
        headers: ["Díjazás - €3700"],
        rows: [] as string[][],
      },
    ],
  },
  sponsors: {
    heading: "Szponzorok és partnerek",
    logos: [
      { name: "Szponzor", image: "/api/media/bb1d4a36-1e09-496c-b813-e9e8ff08ae12.jpg" },
      { name: "Szponzor", image: "/api/media/cbc339d2-e2fd-4f5d-addc-29c1028964df.jpg" },
      { name: "Szponzor", image: "/api/media/91b3370a-a40f-4305-b365-2af7505918e0.png" },
      { name: "Szponzor", image: "/api/media/ddeb74ea-7be6-4ad0-bec6-eb690ec69811.jpg" },
      { name: "Szponzor", image: "/api/media/465764fd-fbe8-4177-8eac-0b65173fd9a6.png" },
      { name: "Szponzor", image: "/api/media/2530b258-931a-428e-aa8c-c24b900b0778.png" },
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
    seoTitle: "World Darts Festival — Event Structure",
    seoDescription: "Foglalj jegyet és regisztrálj a budapesti World Darts Festivalra.",
  },
}

// Translated 1:1 from the live English `page:fontos-informaciok` document (pulled 2026-07-29).
const fontosInformaciokContentHu = {
  title: "Fontos információk",
  subtitle: "Minden, amit a nevezésről, a szabályokról, a játékformátumról és a helyszíni szabályzatról tudnod kell.",
  body: `<p><strong>Verseny szabályzat</strong></p><p></p><p><strong>Általános</strong></p><p></p><p>Minden WDF rangsorolt versenyt a WDF Játék- és Versenyszabályzata szerint kell lejátszani, hacsak a versenyszervező másképp nem rendelkezik.</p><p>Bármely játékos, aki a verseny során nem tartja be a WDF Játékszabályzatának bármelyik pontját, kizárható az adott versenyről.</p><p>A versenyigazgató fenntartja a jogot, hogy szükség esetén módosítsa a programot, a játéksorrendet vagy ezeket a szabályokat. A versenyigazgató döntése végleges.</p><p>Szigorúan tilos kívülről behozott alkoholtartalmú vagy üdítőitalt bevinni a verseny helyszínére, kizárólag a helyszínen vásárolt frissítők fogyaszthatók.</p><p></p><p><strong>Nevezési szabályzat</strong></p><p>A versenyre kizárólag online, a hivatalos <a target="_blank" rel="noopener noreferrer nofollow" href="http://worlddartsfestival.com">worlddartsfestival.com</a> weboldalon keresztül lehet nevezni. Csak azok a nevezések kerülnek elfogadásra, amelyeket ezen a felületen, a megadott nevezési határidő előtt sikeresen elküldtek, mivel a nevezési lista a határidőkor szigorúan lezárásra kerül, és semmilyen körülmények között nem fogadható el késői nevezés vagy utólagos módosítás. <br>Továbbá felhívjuk a figyelmet, hogy a nevezési díjak nem visszatéríthetők.</p><p></p><p><strong>Játékosi magatartás</strong></p><p>Minden résztvevőtől elvárt a tiszteletteljes és sportszerű viselkedés. A sportszerűtlen vagy sértő magatartás fegyelmi intézkedést vagy kizárást vonhat maga után.</p><p></p><p><strong>Mérkőzésformátum</strong></p><p><strong>Open egyéni</strong></p><ul><li><p>Első fordulótól a negyeddöntőig: <strong>legjobb 7 leg</strong></p></li><li><p>Elődöntők: <strong>legjobb 9 leg</strong></p></li><li><p>Döntő: <strong>legjobb 11 leg</strong></p></li></ul><p><strong>Női egyéni</strong></p><ul><li><p>Első fordulótól az elődöntőig: <strong>legjobb 7 leg</strong></p></li><li><p>Döntő: <strong>legjobb 9 leg</strong></p></li></ul><p><strong>Ifjúsági Open egyéni</strong></p><ul><li><p>Selejtező körök a legjobb 32-ig: <strong>legjobb 5 leg</strong></p></li><li><p>Legjobb 16-tól: <strong>legjobb 7 leg</strong></p></li><li><p>Döntő: <strong>legjobb 9 leg</strong></p></li></ul><p><strong>Lány egyéni</strong></p><ul><li><p>Selejtező körök a legjobb 32-ig: <strong>legjobb 5 leg</strong></p></li><li><p>Legjobb 16-tól: <strong>legjobb 7 leg</strong></p></li><li><p>Döntő: <strong>legjobb 9 leg</strong></p></li></ul><p><strong><br>Regisztráció</strong></p><p>Minden játékosnak a meghirdetett zárási időpont előtt be kell fejeznie a regisztrációt. Az a játékos, aki a jelzett időpontig nem regisztrál, kizárásra kerül az adott versenyszámból.</p><p></p><p><strong>Mérkőzésre szólítás</strong></p><p>Az a játékos, aki nem jelenik meg, amikor a kijelölt időpontban <strong>szólítják</strong> a mérkőzésre, elveszíti azt a mérkőzést. A hangosbemondón történő szólítástól számítva <strong>mindössze öt (5) perc</strong> áll a játékos rendelkezésére, hogy elérje az ügyeleti pultot vagy a kijelölt táblát, attól függően, hogy melyik szükséges.</p><p>A játékosoknak <strong>a kijelölt időpontban meg kell jelenniük a hozzájuk rendelt táblánál</strong>; ennek elmulasztása a mérkőzés elvesztését eredményezi — <strong>három (3) perces időkorlát</strong> áll rendelkezésre.</p><p></p><p><strong>Alkoholfogyasztási szabályok</strong></p><p>A mérkőzések alatt az alkoholfogyasztás szigorúan tilos; az ezt megszegő játékos első alkalommal hivatalos figyelmeztetést kap a Versenybizottságtól, második megszegés esetén pedig azonnali kizárással jár a versenyről.</p><p></p><p><strong>Gyakorlás</strong></p><p>Minden játékos jogosult hat (6) gyakorló nyílra a kijelölt táblánál a mérkőzés kezdete előtt. A verseny megkezdése után a ki nem jelölt táblákon gyakorlás nem megengedett, kivéve, ha azt a versenyszervezők engedélyezik.</p><p></p><p><strong>Öltözködési szabályzat</strong></p><p>A játékosok nem viselhetnek farmert: sem farmer- vagy kordbársony anyagból készült, "farmer stílusú" nadrágot vagy szoknyát. Edzőcipő viselése nem megengedett, kivéve, ha a játékos képzett szakember által kiállított írásos orvosi indoklást mutat be. Ez a korlátozás bármilyen "melegítő" jellegű öltözékre is vonatkozik.</p><p>Fejfedő vagy fülhallgató kizárólag vallási okból, illetve képzett szakember által kiállított írásos orvosi indoklás alapján viselhető, a Szervező előzetes, a játékos írásos kérelmére adott engedélyével.</p><p></p><p><strong>Díjazás</strong></p><p>A díjazás a <a target="_blank" rel="noopener noreferrer nofollow" href="http://worlddartsfestival.com">worlddartsfestival.com</a> weboldalon közzétett hivatalos díjalapnak megfelelően kerül kifizetésre. A kifizetéshez a játékosoknak ki kell tölteniük egy erre szolgáló adatlapot, ezt követően a nyereményt banki átutalással kapják meg. Továbbá felhívjuk a figyelmet, hogy a legjobb 8 közé jutott játékosok kötelesek részt venni a hivatalos díjátadó ünnepségen.</p><p></p><p><strong>Fotózás és média</strong></p><p>A versenyre történő nevezéssel a játékosok engedélyt adnak a Szervezőnek, hogy az esemény során készült fényképeket és videófelvételeket promóciós és médiacélokra felhasználja.</p><p></p><p><strong>Felelősség</strong></p><p>A részvétel teljes mértékben a játékos saját felelősségére történik. A Szervező semmilyen felelősséget nem vállal a verseny során bekövetkező veszteségért, lopásért, sérülésért vagy kárért.</p>`,
  meta: {
    seoTitle: "Fontos információk — World Darts Festival",
    seoDescription: "Nevezési szabályok, játékformátum és gyakorlati tudnivalók a versenyzők számára.",
  },
}

// Translated 1:1 from the live English `footer:world-darts-festival` document (pulled 2026-07-29).
// copyrightText is left as-is: the live doc already carries the correct Hungarian string.
const footerContentHu = {
  browseProductsLabel: "",
  categoriesTitle: "",
  contactTitle: "Kapcsolat",
  copyrightText: "© {year} {brand}. Minden jog fenntartva.",
  newsletterLabel: "",
  newsletterPlaceholder: "",
  quickLinks: [
    { label: "Nevezés és foglalás", href: "/jegyek" },
    { label: "Helyszín", href: "/#venue" },
    { label: "Program", href: "/#schedule" },
    { label: "Díjazás", href: "/#prize-money" },
    { label: "Kapcsolat", href: "/#contact" },
  ],
  quickLinksTitle: "Linkek",
  socialLinks: [
    { platform: "facebook", enabled: false, url: "" },
    { platform: "instagram", enabled: false, url: "" },
    { platform: "twitter", enabled: false, url: "" },
    { platform: "youtube", enabled: false, url: "" },
  ],
  tagline: "World Darts Festival",
  contactEntries: [] as never[],
  organizerSection: {
    title: "",
    companyName: "Magyar Darts Szövetség",
    registeredAddress: "1146 Budapest Istvánmezei út 1-3.",
    mailingAddress: "office@magyardarts.hu",
    openingHours: "Munkanapokon 9:00-17:00",
    taxNumber: "19300126-2-41",
  },
  paymentMethodsNote: "",
}

async function upsertHuTemplateContent(pageKey: string, value: unknown, label: string) {
  const key = `${pageKey}@${LOCALE}`
  const existing = await TemplateContent.findOne({ templateId: TEMPLATE_ID, pageKey: key }).lean()
  if (existing) {
    console.log(`  Skipping ${key} — already exists (idempotent, not overwriting).`)
    return
  }
  await TemplateContent.create({
    templateId: TEMPLATE_ID,
    pageKey: key,
    value: JSON.stringify(value),
    publishedAt: new Date(),
    publishedBy: "seed:wdf-i18n-seed",
  })
  console.log(`  Created ${key} (${label}).`)
}

async function main() {
  const uri = resolveUri()
  const dbLabel = uri.includes("@") ? uri.replace(/\/\/[^@]+@/, "//***@") : uri
  console.log(`Connecting to ${dbLabel} …`)
  await mongoose.connect(uri)
  const connectedHost = mongoose.connection.host
  const connectedDb = mongoose.connection.db?.databaseName
  console.log(`Connected to database: ${connectedDb} on host: ${connectedHost}`)

  if (connectedDb !== "world-darts-festival") {
    throw new Error(
      `Refusing to seed: expected database "world-darts-festival", got "${connectedDb}". Set WDF_SEED_DB_URL explicitly.`
    )
  }

  const existingDbs = await mongoose.connection.db!.admin().listDatabases()
  const otherDbNames = existingDbs.databases.map((d) => d.name).filter((n) => n !== "world-darts-festival")
  const looksLikeSharedTBookCluster = otherDbNames.includes("tbook-admin") || otherDbNames.length > 3
  if (!looksLikeSharedTBookCluster) {
    throw new Error(
      `Refusing to seed: connected host "${connectedHost}" doesn't look like the expected shared t-book cluster ` +
        `(sibling databases seen: ${otherDbNames.join(", ") || "none"}). This looks like a fresh/unrelated database, ` +
        `not WDF production. Set WDF_SEED_DB_URL explicitly to override.`
    )
  }

  await backupCollectionsBeforeSeed("wdf-i18n-seed", ["templatecontents", "footersettings"], {
    templateId: TEMPLATE_ID,
  })

  console.log("Seeding Hungarian (hu) content — additive only, existing English docs untouched:")
  await upsertHuTemplateContent("page:home", homeContentHu, "homepage")
  await upsertHuTemplateContent("page:fontos-informaciok", fontosInformaciokContentHu, "important information")

  const footerKey = `footer:${TEMPLATE_ID}@${LOCALE}`
  const existingFooter = await FooterSetting.findOne({ key: footerKey }).lean()
  if (existingFooter) {
    console.log(`  Skipping ${footerKey} — already exists (idempotent, not overwriting).`)
  } else {
    await FooterSetting.create({ key: footerKey, ...footerContentHu })
    console.log(`  Created ${footerKey} (footer).`)
  }

  console.log("Done. Ticketing pages (jegyek/foglalas/foglalas-siker) use in-code Hungarian")
  console.log("fallbacks (defaultContentByLocale) automatically — no DB doc needed for those.")

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

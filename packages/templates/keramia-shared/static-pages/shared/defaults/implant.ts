import type { CampaignPageContent } from "../schema"
import {
  KERAMIA_ADDRESS,
  KERAMIA_PHONE,
  KERAMIA_PROMO_PERIOD_HU,
} from "../../../lib/constants"

/** Default copy from keramiadental_fogpotlas_es_implant/site (data.ts + App.tsx). */
export const implantDefault: CampaignPageContent = {
  locale: "hu",
  hero: {
    badge: KERAMIA_PROMO_PERIOD_HU,
    title: "Pótolja a hiányzó fogait — magabiztos mosollyal",
    tagline: "Fogpótlás és implantáció most 10% kedvezménnyel.",
    subtitle:
      "Prémium implantátumok, élethű koronák és hidak — alapos 3D CT-diagnosztikával, fájdalommentesen, helyi érzéstelenítésben. A teljes fogpótlási palettára 10% kedvezményt adunk, így egy nagyobb beavatkozáson is jelentős összeget takaríthat meg.",
    promoHighlight: "10%",
    promoSubtext: "kedvezmény\na teljes fogpótlásra",
    ctaLabel: "Kérek időpontot",
    phone: KERAMIA_PHONE,
    location: KERAMIA_ADDRESS,
    image: "/templates/keramia-shared/campaign-implant.jpg",
  },
  benefits: [
    {
      title: "3D CT-diagnosztika",
      description:
        "Pontos állapotfelmérés és csontvizsgálat 3D CBCT-felvétellel a kiszámítható eredményért.",
    },
    {
      title: "Fájdalommentes",
      description:
        "Minden beavatkozás helyi érzéstelenítésben, kíméletesen — akár vágás és varrat nélkül.",
    },
    {
      title: "Saját fogtechnikai labor",
      description:
        "Élethű, precíz fogpótlás a legmodernebb CAD/CAM technológiával, gyorsan elkészítve.",
    },
    {
      title: "Hosszú távú garancia",
      description:
        "Bevált implantátumrendszerek és minőségi alapanyagok, hosszú távú garanciával.",
    },
  ],
  offer: {
    eyebrow: "AZ AKCIÓRÓL",
    title: "10% a teljes fogpótlásra és implantációra",
    body:
      "Az akció a teljes fogpótlási palettát lefedi — a prémium implantátumoktól a többtagú hidakon át a koronákig és a fogsorokig. A folyamat mindig egy alapos szakorvosi konzultációval és 3D-s CT-diagnosztikával kezdődik, ahol felmérjük a csontállományt és közösen meghatározzuk a pótlás típusát.\n\nA kezelés helyi érzéstelenítésben, fájdalommentesen történik. Implantáció esetén az ínygyógyulást követően kerül fel a végleges, élethű korona; híd esetén a pillérfogak előkészítése és precíziós lenyomatvétel után rövid időn belül elkészül a tartós fogpótlás — miközben Ön visszakapja a rágóképességét és az önfeledt mosolyát.",
    bullets: [
      "Alapos szakorvosi konzultáció és 3D CT-diagnosztika",
      "A teljes fogpótlási paletta: koronák, hidak, fogsorok és implantátumok",
      "Prémium implantátumok és többtagú hidak is az akcióban",
      "Fájdalommentes kezelés helyi érzéstelenítésben",
      "Élethű, végleges fogpótlás saját fogtechnikai laborunkból",
      "10% kedvezmény a teljes beavatkozásra",
    ],
    discounts: [{ value: "−10%", label: "Minden megoldásra érvényes" }],
    footnotes: [
      "Az akció 2026. június 1. – augusztus 31. között érvényes.",
      "A kedvezmény kizárólag online, az űrlapon keresztüli jelentkezéssel vehető igénybe.",
    ],
  },
  process: {
    eyebrow: "A KEZELÉS MENETE",
    title: "Így zajlik a kezelés",
    subtitle:
      "A konzultációtól a végleges fogpótlásig — kiszámítható, átlátható lépésekben, végig az Ön kényelmét és biztonságát szem előtt tartva.",
    steps: [
      {
        number: "01",
        title: "Konzultáció & 3D CT",
        description:
          "Alapos szakorvosi vizsgálat, digitális panorámaröntgen és 3D CBCT-felvétel: pontosan felmérjük a csontállományt és a fogazat állapotát.",
        duration: "1. találkozás",
      },
      {
        number: "02",
        title: "Személyre szabott terv",
        description:
          "Közösen meghatározzuk a pótlás típusát (implantátum, korona, híd vagy fogsor), és elkészítjük a tervet a pontos árral, időtartammal és garanciával.",
        duration: "ingyenes kezelési terv",
      },
      {
        number: "03",
        title: "Fájdalommentes beavatkozás",
        description:
          "A kezelés helyi érzéstelenítésben, kíméletesen zajlik — implantátumnál akár navigációs, vágás- és varratmentes technikával. Ideiglenes pótlást azonnal kap.",
        duration: "helyi érzéstelenítés",
      },
      {
        number: "04",
        title: "Végleges, élethű pótlás",
        description:
          "A gyógyulás után felkerül a végleges, élethű korona vagy híd. Visszakapja a teljes rágóképességét és az önfeledt mosolyát.",
        duration: "tartós eredmény",
      },
    ],
  },
  services: {
    eyebrow: "MEGOLDÁSAINK",
    title: "Fogpótlás és implantáció a Kerámia Dentalnál",
    subtitle:
      "Az akció a teljes palettára érvényes — minden alábbi megoldásra 10% kedvezményt adunk. Saját fogtechnikai laborunkban, a legmodernebb digitális CAD/CAM technológiával dolgozunk.",
    items: [
      {
        badge: "IMPLANTÁCIÓ",
        title: "Fogászati implantáció",
        description:
          "A hiányzó fog gyökerét titán implantátum pótolja, amelyre élethű korona kerül — a legtartósabb, legtermészetesebb megoldás.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "DIGITÁLIS 3D",
        title: "Navigációs implantálás",
        description:
          "3D-ben tervezett, nyomtatott sebészi sablonnal, tizedmilliméteres pontossággal — vágás és varrat nélkül, rövidebb gyógyulással.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "IMPLANTÁTUMRA",
        title: "Fixen rögzülő fogsor",
        description:
          "Implantátumokra pattintható fogsor: stabilan rögzül, nem mozog, nem kell ragasztó — végre felszabadultan ehet és nevethet.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "FÉMMENTES",
        title: "Cirkon korona",
        description:
          "Fémmentes, cirkónium-oxid alapú korona az eredeti foggal megegyező fényáteresztéssel — tökéletes esztétika a front- és a rágózónában is.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "ESZTÉTIKA",
        title: "Préskerámia korona",
        description:
          "Teljesen kerámiából, váz nélkül készülő korona — a leginkább áttetsző, legélethűbb megoldás, kifejezetten a frontfogakra.",
        ctaLabel: "Időpontot kérek",
      },
      {
        badge: "KLASSZIKUS",
        title: "Fémkerámia korona",
        description:
          "Magyarország legelterjedtebb koronatípusa: fémvázra égetett porcelán — tartós, esztétikus és kedvező árú megoldás.",
        ctaLabel: "Időpontot kérek",
      },
    ],
  },
  beforeAfter: {
    eyebrow: "AZ EREDMÉNY",
    title: "Új fogak, visszanyert életminőség",
    beforeLabel: "Foghiánnyal",
    afterLabel: "Pótlás után",
    caption: "Húzza a csúszkát az összehasonlításhoz · illusztráció",
    beforeImage: "",
    afterImage: "",
  },
  results: {
    eyebrow: "AZ EREDMÉNY",
    title: "Új fogak, visszanyert életminőség",
    body:
      "A korszerű implantáció és fogpótlás nem csak esztétikai kérdés: visszaadja a rágás, a beszéd és a felszabadult mosoly örömét — tartósan és kiszámíthatóan.",
    stats: [
      { value: "Akár 3–5 nap", label: "korona elkészítés" },
      { value: "Fájdalommentes", label: "helyi érzéstelenítés" },
      { value: "Garancia", label: "hosszú távra" },
    ],
    items: [
      {
        category: "FUNKCIÓ",
        title: "Visszanyert rágóképesség",
        description:
          "Újra bármit elfogyaszthat — stabilan rögzített fogakkal, fogsorragasztó nélkül.",
      },
      {
        category: "ESZTÉTIKA",
        title: "Élethű esztétika",
        description:
          "Az eredeti fogtól megkülönböztethetetlen, természetes hatású koronák és hidak.",
      },
      {
        category: "TARTÓSSÁG",
        title: "Tartós megoldás",
        description:
          "Bevált implantátumrendszerek és minőségi alapanyagok, hosszú távú garanciával.",
      },
      {
        category: "ÖNBIZALOM",
        title: "Magabiztos mosoly",
        description:
          "Egy teljes, egészséges mosoly, amely visszaadja az önbizalmát és az életkedvét.",
      },
    ],
  },
  why: {
    eyebrow: "MIÉRT NE HALOGASSA?",
    title: "Miért érdemes pótolni a hiányzó fogakat?",
    tip:
      "TIPP: Minél tovább marad pótolatlanul egy fog, annál nagyobb a csontvesztés — az időben elkezdett implantáció egyszerűbb és kiszámíthatóbb.",
    body:
      "A foghiány nem csak esztétikai kérdés. A rágófunkció romlása emésztési panaszokat okozhat, a pótolatlan területen pedig az állcsont fokozatosan sorvad, a szomszédos fogak elmozdulnak. Az időben elkezdett fogpótlás megelőzi ezeket — és visszaadja az életminőségét.",
    bullets: [
      "A hiányzó fog miatt romlik a rágófunkció, ami emésztési panaszokhoz és hiánybetegségekhez vezethet.",
      "A foghiány helyén az állcsont fokozatosan sorvad, a szomszédos fogak elmozdulnak és megdőlnek.",
      "Az implantátum a szomszédos fogak csiszolása nélkül pótol, és megőrzi az állcsont állományát.",
      "A stabil, rögzített fogpótlással visszatér a magabiztos rágás, beszéd és mosoly.",
      "A 3D CT-diagnosztikának köszönhetően a kezelés pontosan tervezhető és kiszámítható.",
      "A foghiány hosszú távon esztétikai és pszichés terhet is jelenthet — minél előbb pótoljuk, annál egyszerűbb.",
    ],
  },
  faq: {
    eyebrow: "GYAKORI KÉRDÉSEK",
    title: "Amit a kezelésről tudni érdemes",
    items: [
      {
        question: "Mire vonatkozik a 10%-os kedvezmény?",
        answer:
          "Az akció a teljes fogpótlási palettára érvényes: az implantátumokra, a koronákra (cirkon, préskerámia, fémkerámia), a többtagú hidakra és a fogsorokra egyaránt. A 2026. június 1. és augusztus 31. között indított kezelésekre 10% kedvezményt adunk — a pontos összeget a személyre szabott kezelési tervben rögzítjük.",
      },
      {
        question: "Fájdalmas az implantátum beültetése?",
        answer:
          "Nem. A beavatkozás helyi érzéstelenítésben történik, így teljesen fájdalommentes. A navigációs, sebészi sablonnal végzett implantáció ráadásul vágás és varrat nélkül is elvégezhető, ami kíméletesebb, és gyorsabb gyógyulást jelent. A kezelés után jelentkező enyhe érzékenység néhány nap alatt elmúlik.",
      },
      {
        question: "Mennyi ideig tart a teljes folyamat?",
        answer:
          "Ez a pótlás típusától függ. A koronák és hidak akár 3–5 nap alatt elkészülnek. Implantáció esetén a beültetést követően a csontosodás (beépülés) néhány hónapot vesz igénybe, és csak ezután kerül fel a végleges fogpótlás — de ez idő alatt sem kell fog nélkül lennie, mert azonnal ideiglenes pótlást készítünk.",
      },
      {
        question: "Mi van, ha kevés a csontom az implantátumhoz?",
        answer:
          "Ez sem feltétlenül akadály. A 3D CT-felvétel alapján pontosan felmérjük a csontállományt, és szükség esetén csontpótlást vagy arcüregemelést (sinus-lift) végzünk. A gyógyulás gyorsítására a saját véréből előállított A-PRF (fibrin) membránt is alkalmazunk, amely elősegíti a csontregenerációt és az implantátum stabilitását.",
      },
      {
        question: "Meddig tartanak ki az implantátumok és a fogpótlások?",
        answer:
          "Megfelelő szájhigiéniával és rendszeres kontrollal az implantátum akár egy életen át szolgálhat — a bevált implantátumrendszerekre kiemelt garanciát vállalunk. A koronák és hidak is hosszú évekig tartanak. A pontos garanciális feltételeket minden esetben a kezelési tervben rögzítjük.",
      },
      {
        question: "Implantátum, híd vagy fogsor — melyik a jó megoldás nekem?",
        answer:
          "Ezt a konzultáción, a 3D diagnosztika alapján közösen döntjük el. Az implantátum a legtartósabb, a szomszédos fogakat kímélő megoldás; ahol ez nem lehetséges, ott esztétikus hidat, kombinált vagy rugalmas fogsort készítünk. A cél mindig a legjobb, leghosszabb távú eredmény az Ön számára.",
      },
    ],
  },
  ctaBand: {
    title: "Kezdje el az új mosolyát még a nyáron!",
    subtitle:
      "Foglaljon időpontot a fogpótlás és implantáció akcióra, és élvezze a 10% kedvezményt a teljes kezelésre.",
    bullets: [
      "Az akció 2026. június 1. – augusztus 31. között",
      "csak online jelentkezéssel",
    ],
    ctaLabel: "Kérek időpontot",
  },
  contact: {
    eyebrow: "KAPCSOLAT",
    title: "Foglaljon időpontot az akcióra",
    subtitle:
      "Hagyja meg elérhetőségét, és kollégánk hamarosan visszahívja egy díjmentes konzultáció egyeztetéséhez. Telefonon is várjuk hívását.",
    nameLabel: "Teljes név",
    phoneLabel: "Telefonszám",
    emailLabel: "E-mail cím",
    interestLabel: "Mire szeretne időpontot?",
    messageLabel: "Megjegyzés (opcionális)",
    privacyText:
      "Az adatkezelési tájékoztatót elolvastam és elfogadom, hozzájárulok adataim kezeléséhez a kapcsolatfelvétel céljából.",
    submitLabel: "Jelentkezés elküldése",
    interestOptions: [
      { value: "konzultacio-ct", label: "Konzultáció + 3D CT diagnosztika" },
      { value: "implantacio", label: "Fogászati implantáció" },
      { value: "navigacios", label: "Navigációs implantálás" },
      { value: "fix-fogsor", label: "Fixen rögzülő fogsor" },
      { value: "cirkon", label: "Cirkon korona" },
      { value: "preskeramia", label: "Préskerámia korona" },
      { value: "femkeramia", label: "Fémkerámia korona" },
      { value: "egyeb", label: "Egyéb / konzultáció" },
    ],
  },
  meta: {
    seoTitle: "Fogpótlás + implantáció akció | Kerámia Dental Székesfehérvár",
    seoDescription:
      "Fogpótlás és implantáció akció a Kerámia Dentalnál Székesfehérváron – most 10% kedvezménnyel a teljes palettára: implantátum, korona, híd és fogsor. 3D CT-diagnosztika, fájdalommentes kezelés.",
  },
}

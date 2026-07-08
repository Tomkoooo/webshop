import type { HomepageSnapshot } from "../../../src/features/homepage-cms/types/block-types"
import { nagyarcuPressTestimonialsBlock } from "./nagyarcu-press-quotes"

const HERO_BADGES = [
  "Nem propaganda. Képregény.",
  "Valódi alkotók. Valódi történetek.",
  "A közelmúlt képkockákba zárva.",
  "Mesterséges propaganda helyett emberi látásmód.",
  "A kilencedik művészet válasza a propagandára.",
]

const HERO_DESCRIPTION = `Valódi művészet a propaganda árnyékában

Egy különleges magyar képregény, amely a közelmúlt hazai eseményeit egyedi vizuális látásmóddal és független alkotói szemlélettel dolgozza fel. Nem kampányanyag. Nem propaganda. Nem mesterséges intelligencia által gyártott tartalom. Hanem független alkotók közös munkájának eredménye. Bemutatja, hogy a képregény lehet egyszerre művészet, dokumentum és társadalmi tükör.`

const COLLABORATOR_CARDS = [
  {
    title: "Hollerbach Emil",
    description:
      "Az elmúlt 16 évben a hatalom mindent megtett, hogy ilyen munkák ne lássanak napvilágot ... szóval nem volt kérdés, hogy részt akarok venni a megalkotásában!\n\nNa, és pont ez az az érzés, amit egy gép sohasem fog tudni visszaadni!",
    icon: "Quote",
  },
  {
    title: "Lakatos István",
    description: "Képregény-alkotó",
    icon: "User",
  },
  {
    title: "Lanczinger Mátyás",
    description: "Képregény-alkotó",
    icon: "User",
  },
  {
    title: "László Márk",
    description: "Képregény-alkotó",
    icon: "User",
  },
  {
    title: "Robert Marko Bøse",
    description: "Képregény-alkotó",
    icon: "User",
  },
  {
    title: "Tikos Péter",
    description:
      "A NER 16 éve alatt végignéztem, ahogy számos ismerősöm és barátom élete, vállalkozása megy tönkre. Sokak családja és jövője látta kárát. Sokan külföldre költöztek — köztük mi is, két gyermekünkkel. Sokan már nem érhették meg a rendszer végnapjait.\n\nEz alatt az idő alatt rengetegszer éreztem elkeseredettséget, tehetetlenséget, szomorúságot és dühöt. Fájdalmas volt látni, ahogy a gyűlölet politikája átszőtte a mindennapokat, életeket tett tönkre, és talán generációkra megmérgezte a közbeszédet és a közgondolkodást.\n\n2025-ben Párizsban megvásároltam a Charlie Hebdo különszámát, amelyben az alkotók a tíz évvel korábbi terrortámadásra emlékeztek — és nem fogták vissza magukat. Irigylésre méltónak tartom ezt a hozzáállást: hogy humorral és szatírával is lehet küzdeni a félelem és a megfélemlítés ellen. Hogy félelem nélkül lehet görbe tükröt tartani a butaságnak és a hatalmi gőgnek. És hogy az ostoba hatalom arcába nemcsak lehet, hanem kell is nevetni.\n\nGrafikus, illusztrátor, művész vagyok. Gyerekkorom óta képregényrajongó és -gyűjtő. Rendkívül alpárinak és felháborítónak tartom az „Én, a kétarcú” című kiadványt. Számomra ez a kiadvány a NER hazugságainak mesterséges intelligencia által generált, kézzel fogható megtestesülése — és a kilencedik művészeti ág megcsúfolása. Amikor felmerült egy „ellenkiadvány” ötlete, és hogy dolgozhatok rajta, azonnal igent mondtam.",
    icon: "Palette",
  },
  {
    title: "Márton László Áron",
    description:
      "Tizenöt–húsz éve töretlenül, önerőből, külső segítség és támogatások nélkül meséljük el saját történeteinket a képregény médiumának eszközeivel.\n\nSok alkotó érezhette azt az előző rendszer által, hogy amit csinál, az nem számít és nem képvisel értéket. Az „Én a Kétarcú” megjelenése pedig ezt még jobban megerősítette bennünk.\n\nMár nem csak figyelmen kívül hagynak, de a képünkbe is nevetnek. Ez pedig választ kívánt.",
    icon: "Quote",
  },
  {
    title: "Ellensulyok Tamás",
    description:
      "Egyrészt azért szálltam be ebbe a projektbe, hogy én is segítsek kreatív választ adni arra a propaganda AI szennyre, amivel vélemény szerint szembeköpték a magyar képregényalkotókat és képregényrajongókat is.\n\nMásrészt szerettem volna ily módon is megemlékezni arról, hogy 16 év után végre vége van ennek az abszurd rendszernek.",
    icon: "Quote",
  },
  {
    title: "Urbán Mihály Győző",
    description:
      "Az „Én a Kétarcú” megjelenése, kampánya, támogatása és terjesztése a világ összes képregényalkotójának meggyalázása és az ígénytelenség csúcsa.\n\nTökéletesen jellemzi az utóbbi 16 évet. Színes szagos hazugság, ami mögött nincs se tartalom, se valódi kreatív munka.",
    icon: "Quote",
  },
  {
    title: "Jótékonysági vállalás",
    description:
      "A projekt készítői fontosnak tartják a társadalmi felelősségvállalást is. Minden eladott példány után 500 forintot jótékony célokra ajánlják fel.\n\nA képregény értékesítéséből befolyt összeg egy részét jótékony célokra ajánljuk fel. Célunk, hogy a hazai képregényes szakma, a gyermekvédelem és az utánpótlássport egyszerre részesüljön a kiadvány bevételéből.\n\nHazai képregényalkotókkal és gyermekvédelemmel foglalkozó szakértőkkel közösen létrehozunk egy képregényt, amely gyermekotthonban nevelkedő fiataloknak szól. Pályázatot írunk ki feltörekvő képregényalkotó tehetségeknek. Támogatjuk az utánpótlássportot, hogy ifjú tehetségeink részt vehessenek a nemzetközi tornákon.\n\nÉlményt adunk gyermekotthonokban élő gyerekeknek olyan szervezeteken keresztül, amelyek a mindennapi működést segítik. Amikor nálunk vásárolsz, e három cél megvalósítását is támogatod, és erről átlátható módon be is számolunk a későbbiekben.",
    icon: "Heart",
  },
]

export function buildNagyarcuHomepageSnapshot(): HomepageSnapshot {
  const heroSlide = {
    title: "Én, a nagyarcú",
    description: HERO_DESCRIPTION,
    primaryCtaLabel: "Előrendelés",
    primaryCtaHref: "/shop",
    secondaryCtaLabel: "Rólunk",
    secondaryCtaHref: "#about",
    badges: HERO_BADGES,
    images: ["/generic-hero.svg"],
    imageDurationSeconds: 4,
    durationSeconds: 6,
  }

  return {
    meta: {
      seoTitle: "ÉN, A NAGYARCÚ",
      seoDescription: "Én, a nagyarcú képregény sorozat hivatalos webáruháza — limitált magyar képregény-antológia.",
    },
    blocks: [
      {
        id: "hero-1",
        type: "hero",
        enabled: true,
        data: {
          title: "Én, a nagyarcú",
          description: HERO_DESCRIPTION,
          primaryCtaLabel: "Előrendelés",
          primaryCtaHref: "/shop",
          secondaryCtaLabel: "Rólunk",
          secondaryCtaHref: "#about",
          heroImage: "/generic-hero.svg",
          heroImages: ["/generic-hero.svg"],
          imageDurationSeconds: 4,
          heroDurationSeconds: 6,
          heroSlides: [heroSlide],
          badges: HERO_BADGES,
        },
      },
      {
        id: "about-1",
        type: "about",
        enabled: true,
        data: {
          title: "Rólunk",
          paragraph:
            "Az „Én, a nagyarcú” egy kortárs magyar képregény-antológia, amely vizuális krónikaként ábrázolja Magyarország elmúlt éveinek meghatározó közéleti pillanatait.",
          accordions: [
            {
              title: "Mi az „Én, a nagyarcú”?",
              content:
                "Az „Én, a nagyarcú” egy kortárs magyar képregény-antológia, amely vizuális krónikaként ábrázolja Magyarország elmúlt éveinek meghatározó közéleti pillanatait. A kötet különböző alkotók egyéni látásmódján keresztül mutatja meg azt a korszakot, amelyben a propaganda, a médiazaj és a mesterségesen generált tartalmak egyre inkább összemosódtak a valósággal.",
            },
            {
              title: "Történelemkönyv? Dokumentum? Nem fikció!",
              content:
                "A képregény kommentár és politikai állásfoglalás nélkül mutatja be a közelmúlt magyarországi közéleti történéseit. Az olvasók felismerhetnek benne jól ismert közszereplőket és az ő elhíresült mondataikat, cselekedeteiket. A készítők úgy érezték, hogy az elhangzottakhoz és a megtörtént eseményekhez már nem kell semmit hozzátenniük, elegendő az, ha csupán bemutatják azokat.\n\nA kiadvány nem politikai kiáltványként született meg. Az alkotók célja sokkal inkább az volt, hogy visszaadják a képregény mint művészeti forma hitelességét és autonómiáját. A kötet annak bizonyítéka, hogy a képregény képes érzékenyen, összetetten bemutatni a közélet eseményeit.",
            },
            {
              title: "Miért készült el ez a képregény?",
              content:
                "Az előző rendszer kultúrpolitikája a megosztást, a klientúraépítést és a hatalom céljait támogató művészek támogatását szolgálta. Értékálló művek létrehozását nem segítette. Romboló hatását mindannyian tapasztalhattuk.\n\nA múzeumok tönkretétele és kifosztása, a közoktatás színvonalának lezüllesztése, a közmédia kisajátítása, a független színházak forrásmegvonása, a független filmgyártás és könyvkiadás ellehetetlenítése után a kampány hajrájában a képregény műfaját is felhasználták.\n\nA több száz millió forint közpénz felhasználásával népszerűsített, mesterséges intelligencia segítségével létrehozott „Én, a kétarcú” című képregény megjelentetése egyértelműen propagandacélokat szolgált, ráadásul fájdalmasan amatőr és igénytelen módon.\n\nAz „Én, a nagyarcú” készítői úgy érezték, hogy a szakma és a műfaj becsületét védve erre a kiadványra reagálniuk kell. Ezért ellenpontként megmutatják, hogy mire képes a valódi intelligencia és tehetség a mesterséges intelligenciával és a propagandával szemben.",
            },
            {
              title: "Független kiadvány — nulla forint közpénzből is lehet!",
              content:
                "Az „Én, a nagyarcú” teljes egészében független projektként valósult meg. A kötet megjelenését politikai párt, alapítvány, politikusok családtagjaihoz köthető cég, sem az Önöktől ellopott közpénz, sem Brüsszel, sem a Soros vagy Zelenszkij-féle guruló dollárok sem támogatták.\n\nAz alkotók saját, független szakmai meggyőződésük és felelősségérzetük szerint dolgoztak.\n\n• nincs állami támogatás!\n• pártfinanszírozás nélkül!\n• mesterséges intelligenciával generált oldalak száma: 0\n• vigyázat, nem propaganda!\n• vigyázat, eredeti!\n\nA kötetben található minden képkocka valódi alkotói munkával készült. Valódi emberek rajzolták, a saját kezükkel. Az „Én, a nagyarcú” létrejöttében a hazai képregényes szcéna ismert és elismert alkotói vettek részt.",
            },
            {
              title: "A kiadvány adatai",
              content:
                "Cím: Én, a nagyarcú\nTerjedelem: 28 oldal\nMegjelenés: 2026. június 22.\nAjánlott fogyasztói ár: 3 800 Ft\nKiadó: Eseményszervezés.hu BTL Ügynökség Kft.\nFormátum: limitált nyomtatott kiadás",
            },
            {
              title: "Presskukac!",
              content:
                "Sajtómegkeresések, interjúkérések és együttműködési ajánlatok: presskukac@nagyarcu.hu",
            },
          ],
          cards: [
            {
              title: "„Nem propaganda. Képregény.”",
              description: "Nem kampányanyag — független alkotói szemlélet.",
              icon: "Shield",
            },
            {
              title: "„Valódi alkotók. Valódi történetek.”",
              description: "A kötet minden oldala valódi emberek valódi alkotói munkája.",
              icon: "PenLine",
            },
            {
              title: "„A közelmúlt képkockákba zárva.”",
              description: "A közelmúlt közéleti pillanatai képregényes formában, emberi látásmóddal.",
              icon: "BookOpen",
            },
            {
              title: "„Mesterséges propaganda helyett emberi látásmód.”",
              description: "AI-generált kampányanyag helyett független, személyes és kézzel rajzolt válasz.",
              icon: "Eye",
            },
            {
              title: "„A kilencedik művészet válasza a propagandára.”",
              description: "A képregény médiumának hiteles, alkotói válasza a propagandára.",
              icon: "Quote",
            },
          ],
        },
      },
      nagyarcuPressTestimonialsBlock,
      {
        id: "gallery-1",
        type: "gallery",
        enabled: false,
        data: {
          title: "Galéria",
          items: [],
        },
      },
      {
        id: "features-1",
        type: "features",
        enabled: true,
        data: {
          title: "Közreműködők",
          subtitle:
            "Az alkotók különböző stílusokkal, egyedi vizuális megközelítésekkel és narratív eszközökkel dolgoznak, így a kötet egyszerre sokszínű művészeti projekt és egységes társadalmi lenyomat. Borító: Tikos Péter munkája.",
          cards: COLLABORATOR_CARDS,
        },
      },
      {
        id: "products-1",
        type: "productGrid",
        enabled: true,
        data: {
          title: "Előrendelés",
          description: "Limitált nyomtatott kiadás — 28 oldal, 3 800 Ft",
          viewAllLabel: "Összes termék",
          viewAllHref: "/shop",
          categoriesTitle: "Kategóriák",
          categoriesDescription: "Böngéssz a katalógusban kategória szerint.",
          layout: "grid",
          maxItems: 8,
          selectedProductIds: [],
        },
      },
      {
        id: "contact-1",
        type: "contact",
        enabled: true,
        data: {
          title: "Kapcsolat",
          description:
            "Sajtómegkeresések, interjúkérések és együttműködési ajánlatok: presskukac@nagyarcu.hu",
          companyName: "ÉN, A NAGYARCÚ",
          address: "",
          phone: "",
          email: "presskukac@nagyarcu.hu",
          sendButtonLabel: "Üzenet küldése",
          nameLabel: "Név",
          emailLabel: "E-mail",
          messageLabel: "Üzenet",
        },
      },
    ],
  }
}

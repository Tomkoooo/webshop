import "dotenv/config";
import mongoose from "mongoose";
import ShopContent from "../src/models/ShopContent";

const MONGODB_URI = process.env.DATABASE_URL;

const creatorFeatureCards = [
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
      "Tizenöt-húsz éve töretlenül, önerőből, külső segítség és támogatások nélkül meséljük el saját történeteinket a képregény médiumának eszközivel.\n\nSok alkotó érezhette azt az előző rendszer által, hogy amit csinál, az nem számít és nem képvisel értéket. Az „Én a Kétarcú” megjelenése pedig ezt még jobban megerősítette bennünk.\n\nMár nem csak figyelmen kívül hagynak, de a képünkbe is nevetnek. Ez pedig választ kívánt.",
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
      "Az „Én a Kétarcú” megjelenése, kampánya, támogatása és terjesztése a világ összes képregényalkotójának meggyalázása és az ígénytelenség csúcsa.\n\nTökéletesen jellemzi az utobbi 16 évet. Színes szagos hazugság, ami mögött nincs se tartalom, se valódi kreatív munka.",
    icon: "Quote",
  },
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
  {
    title: "Jótékonysági vállalás",
    description:
      "A projekt készítői fontosnak tartják a társadalmi felelősségvállalást is. Minden eladott példány után 500 forintot jótékony célokra ajánlják fel. A támogatott szervezetekről és kezdeményezésekről a megjelenést követően adnak részletes tájékoztatást.",
    icon: "Heart",
  },
];

const initialContent = [
  {
    key: "hero_title",
    value: "Lorem Ipsum Dolor",
    section: "hero",
  },
  {
    key: "hero_description",
    value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    section: "hero",
  },
  {
    key: "hero_primary_cta",
    value: "GO TO SHOP",
    section: "hero",
  },
  {
    key: "hero_secondary_cta",
    value: "ABOUT US",
    section: "hero",
  },
  {
    key: "hero_badges",
    value: JSON.stringify([
      { title: "LOREM", subtitle: "IPSUM" },
      { title: "DOLOR", subtitle: "SIT" },
      { title: "AMET", subtitle: "ELIT" }
    ]),
    section: "hero",
  },
  {
    key: "story_title",
    value: "Lorem Ipsum Story",
    section: "story",
  },
  {
    key: "story_content",
    value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    section: "story",
  },
  {
    key: "story_cards",
    value: JSON.stringify([
      { title: "LOREM", content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit." },
      { title: "IPSUM", content: "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua." },
      { title: "DOLOR", content: "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris." },
      { title: "AMET", content: "Duis aute irure dolor in reprehenderit in voluptate velit esse." }
    ]),
    section: "story",
  },
  {
    key: "features_title",
    value: "Közreműködők",
    section: "features",
  },
  {
    key: "features_subtitle",
    value: "A hazai képregényes szcéna ismert és elismert alkotói — különböző stílusokkal, egyedi vizuális megközelítésekkel. Borító: Tikos Péter munkája.",
    section: "features",
  },
  {
    key: "features_cards",
    value: JSON.stringify(creatorFeatureCards),
    section: "features",
  },
  {
    key: "reviews_title",
    value: "CUSTOMER REVIEWS",
    section: "reviews",
  },
  {
    key: "reviews_subtitle",
    value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    section: "reviews",
  },
  {
    key: "shop_title",
    value: "PRODUCT CATALOG",
    section: "shop",
  },
  {
    key: "shop_description",
    value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    section: "shop",
  },
  {
    key: "shop_view_all_label",
    value: "VIEW ALL PRODUCTS",
    section: "shop",
  },
  {
    key: "shop_featured_title",
    value: "FEATURED PRODUCTS",
    section: "shop",
  },
  {
    key: "contact_title",
    value: "GET IN TOUCH",
    section: "contact",
  },
  {
    key: "contact_highlight",
    value: "WITH US",
    section: "contact",
  },
  {
    key: "contact_description",
    value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    section: "contact",
  },
  {
    key: "contact_form_button",
    value: "SEND MESSAGE",
    section: "contact",
  },
  {
    key: "shop_seo_title",
    value: "Webshop | Lorem Ipsum Store",
    section: "shop",
  },
  {
    key: "shop_seo_description",
    value: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
    section: "shop",
  },
  {
    key: "contact_email",
    value: "hello@example.com",
    section: "contact",
  },
  {
    key: "contact_phone",
    value: "+1 555 000 0000",
    section: "contact",
  },
  {
    key: "contact_address",
    value: "123 Example Street, Example City",
    section: "contact",
  },
];

async function seed() {
  if (!MONGODB_URI) {
    throw new Error("DATABASE_URL is not defined");
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  console.log("Start seeding...");
  
  for (const item of initialContent) {
    await ShopContent.findOneAndUpdate(
      { key: item.key },
      item,
      { upsert: true, returnDocument: "after" }
    );
  }

  console.log("Seeding finished.");
  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

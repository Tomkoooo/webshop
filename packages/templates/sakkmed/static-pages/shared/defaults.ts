import type { SakkmedPageContent } from "./schema"

function page(
  title: string,
  sections: Array<{ heading?: string; body: string; image?: string }>,
  gallery: Array<{ image?: string; caption?: string }> = [],
  contactEmail = ""
): SakkmedPageContent {
  return {
    hero: {
      title,
      subtitle: sections[0]?.body.slice(0, 220) ?? "",
      image: sections[0]?.image ?? gallery[0]?.image ?? "",
    },
    sections: sections.map((s) => ({
      heading: s.heading ?? "",
      body: s.body,
      image: s.image ?? "",
    })),
    gallery: gallery.map((g) => ({
      image: g.image ?? "",
      caption: g.caption ?? "",
    })),
    contactEmail,
    contactLabel: "Megrendelés és információ",
    meta: {
      seoTitle: `${title} | SAKKMED 2005 Kft.`,
      seoDescription: sections[0]?.body.slice(0, 160) ?? title,
    },
  }
}

/** Default copy scraped from https://balazsgabor3.wixsite.com/sakkmed2 — images filled by seed script. */
export const SAKKMED_STATIC_DEFAULTS: Record<string, SakkmedPageContent> = {
  butoraink: page(
    "Bútoraink",
    [
      {
        body: "Kínálatunkat a felmerülő igényeknek megfelelően állítottuk össze. Bútorokon kívül portfóliónk fontos részét képezik a kiegészítők, textíliák, spandex huzatok.",
      },
      {
        body: "Bútort keres rendezvényére? Nálunk bátran válogathat, hiszen kínálatunkban megtalálhatóak beltéri és kültéri bútorok egyaránt.",
      },
      {
        heading: "Beltéri bútorok",
        body: "Beltérre ajánljuk alkalomtól függően lounge és alkalmi bútorainkat, amelyeket kültéren is lehet használni, megfelelő védelem mellett. Bútoraink mellé textiliák is a rendelkezésére állnak, amennyiben nem találja meg amit keresett, dekor és varróműhelyünk az Ön igénye szerint legyártja.",
      },
      {
        heading: "Kültéri bútorok",
        body: "Kültéri bútorainkat alapvetően szabadtéri rendezvényekre ajánljuk. Tökéletesek ültetett rendezvényekre, illetve piknik rendezvényekre is. Igény esetén asztalos műhelyünk minden kívánságát teljesíti.",
      },
      {
        body: "Bútoraink több féle színben elérhetőek, könnyen tisztíthatóak és tárolhatóak.",
      },
      {
        heading: "Asztalok",
        body: "Táblaasztal: fehér műanyag, vagy fa hatású asztallappal, behajtható lábakkal. Mérete 180x80 cm\nBankett asztal: 8-10 személyes, kerek bankett asztal, behajtható lábakkal. Mérete: 180 cm\nMagas asztal: fehér műanyag, vagy fa hatású asztallappal, behajtható lábakkal. Mérete 110x80 cm\nKönyöklő: fekete műanyag, Mérete 110x80 cm\nDohányzó asztal: Méret 90/50",
      },
    ],
    [],
    "butor@esemenyszervezes.hu"
  ),
  installaciok: page("Installációk", [
    {
      body: "Egyedi tervezésű standjainkkal garantáljuk, hogy cége kitűnik a versenytársak közül. A cég arculatához tervezzük az egyedi formát, modern bútorokkal és kiegészítőkkel tesszük teljessé a megjelenést. Az installációk által nagy reklámfelületet nyer, mellyel még vonzóbbá teheti a vásárlók, üzleti partnerek számára a standját. Kültéren és beltéren is építünk standokat.",
    },
    {
      heading: "Syma rendszerű installáció",
      body: "Alumínium oszlop és kötőelem, fehér vagy nyomtatott betételemekkel. Egyszerű és egyedi installáció megépítésére is alkalmas, számtalan kombinációs lehetőséget nyújt a Syma rendszer.",
    },
    {
      heading: "Alutruss installáció",
      body: "A rendezvényvilágból ismert Alutruss rendszer egyenes, sarok vagy íves elemeivel kreatív megoldásokat kínál installációk kivitelezéséhez.",
    },
    {
      heading: "Layher installáció",
      body: "Az építkezésekről már jól ismert Layher rendszer kiválóan alkalmas kültéri és beltéri rendezvények egyedi felépítmények, fedések, vagy akár színpadok kivitelezésére is.",
    },
    {
      heading: "Vásári installációk",
      body: "A vásárok egységes arculatára törekedve, kézművesek, kereskedők részére kecskelábú árusító asztalokat kínálunk. Az asztalok napfénytetővel felszereltek. Mérete: 200 x 80 cm.",
    },
  ]),
  traverz: page("Traverz rendszerek", [
    {
      body: "A rendezvényvilágból ismert Alutruss rendszer egyenes, sarok vagy íves elemeivel kreatív megoldásokat kínál installációk kivitelezéséhez. Egyszerűen építhető, önmagában hightech megjelenést nyújt, de dekorációval a legelegánsabb megjelenést is el tudjuk érni.",
    },
    {
      heading: '1 "utas" traverz',
      body: "35mm és 50mm csőrendszer 2mm falvastagság 0,01m - 2,5m univerzális kocka, 2-3-4-5 irányú elemek T megoldások, speciális alakok",
    },
    {
      heading: '3 "utas" traverz',
      body: "35mm és 50mm csőrendszer 2mm falvastagság 0,01m - 4,0m 2-3-4-5 irányú elemek T megoldások, speciális alakok",
    },
    {
      heading: "Fix lábas fedések, sátrak",
      body: "Különféle rendezvények és kiállítások legkedveltebb fedése. A fedést, sátrat az Ön igénye szerint megtervezzük és kivitelezzük. Oldalfal és sátortető opcionálisan rendelhető!",
    },
  ]),
  layher: page("Layher rendszerek", [
    {
      body: "Az építkezésekről már jól ismert Layher rendszer bebizonyította, hogy kiválóan alkalmas kültéri és beltéri rendezvények egyedi felépítmények, fedések, vagy akár színpadok kivitelezésére is.",
    },
  ]),
  emelestechnika: page("Emeléstechnika", [
    {
      heading: "1t emelőmotor",
      body: "Emelési magasság (lánchossz): 24m\nTeherbírás: 1000 kg\nElérhető mennyiség: 40+ db\n8 csatornás motorvezérlő, bemeneti csatlakozó: 3x32A",
    },
    {
      heading: "250kg emelőmotor",
      body: "Emelési magasság (lánchossz): 24m\nTeherbírás: 250 kg\nElérhető mennyiség: 60+ db\n2 csatornás motorvezérlő, bemeneti csatlakozó: 3x16A",
    },
    {
      heading: "Motorvezérlő",
      body: "Csatlakozó 3x16A (4P)\nMéretek: 5m | 10m | 20m\nElérhető mennyiség: méretenként 50-50 db",
    },
  ]),
  alutent: page("Alutent", [
    {
      body: "A szabadtéri rendezvények egyik legkedveltebb eszköze az alutent sátrak. Sátraink két méretben, 6x3 és 3x3 méretben érhetőek el, fekete és fehér színben. A sátrak padlóburkolását műanyagaljzattal, színpadelemmel, illetve állítható layher rendszerrel biztosítjuk.",
    },
    {
      body: "Sátrainkat az Ön igénye szerint kreatívan dekorálhatjuk, aminek köszönhetően még látványosabb lesz az eredmény.",
    },
    {
      heading: "Alutent 6x3 sátor",
      body: "Fehér és fekete színben, oldalfallal elérhető",
    },
    {
      heading: "Alutent 3x3 sátor",
      body: "Fehér és fekete színben, oldalfallal elérhető",
    },
  ], [], "butor@esemenyszervezes.hu"),
  aramhalozat: page("Áramhálózat", [
    {
      body: "A helyszín adottságait figyelembe véve teljes elektromos hálózat kiépítést vállalunk. Amennyiben nem áll rendelkezésre a megfelelő teljesítményű kiállás, úgy áramfejlesztők használatával vagy a területi illetékes áramszolgáltató bevonásával oldjuk meg az áramellátást.",
    },
    {
      body: "Az elektromos hálózat tervezéstől, az ügyintézésen át, a kivitelezésig teljes körű lebonyolítást végzünk regisztrált villanyszerelő szakemberek közreműködésével. Minden munkánk után az átadás-átvételi jegyzőkönyvvel egyidejűleg a hatályos jogszabályoknak megfelelő érintésvédelmi jegyzőkönyvet is készítünk.",
    },
    {
      body: "Elektromos berendezéseink évente bevizsgálásra kerülnek, érintésvédelmi relével ellátottak. Az érintésvédelmi szabályoknak megfelelő kábelekkel, elosztókkal, kapcsolószekrényekkel rendelkezünk.",
    },
  ]),
  vizmu: page("Közműhálózat", [
    {
      body: "A helyszín adottságainak megfelelően teljes közműhálózat (víz- és csatorna) kiépítését kivitelezzük. A vezetékek magas nyomású, műanyag csövek, melyek mind víz, mind szennyvíz szállítására alkalmasak.",
    },
    {
      body: "Szakembereink a közmű kiállások ismeretében, a vízvételi pontokon vízminta alapján beszerzik a szükséges hatósági engedélyeket, a rendezvény igényei alapján tervet készítenek, és a teljes üzemelést ellátják.",
    },
  ]),
  syma: page("Syma", [
    {
      body: "Alumínium oszlop és kötőelem, fehér vagy nyomtatott betételemekkel. Egyszerű és egyedi installáció megépítésére is alkalmas, számtalan kombinációs lehetőséget nyújt a Syma rendszer. Alkalmazkodik a helyi adottságokhoz, egyszerűen telepíthető vagy akár átépíthető.",
    },
    {
      body: "További információkért tekintse meg katalógusunkat!",
    },
  ]),
  "fesztival-vip": page("Fesztivál VIP", [
    {
      body: "A FESZTIVÁLVIP ötlete sokéves rendezvény és kommunikációs tapasztalataink alapján született. Minden fesztiválnak – lehet az szabadtéri, avagy beltéri, kulturális, szórakoztató, sport vagy gasztro tematikájú – kell, hogy legyen egy kisebb vagy nagyobb helye, ahol legfontosabb partnereivel nyugodt és elkülönített helyszínen találkozhat kiemelt vendégeivel.",
    },
    {
      body: "Így lehet bárhol, bármilyen időben fesztiválod exkluzív VIP helyszín holisztikus megtervezésére, felépítésére, nyomdai-, eszközgyártási, installációs- és dekorációs munkáira itt vagyunk mi a FESZTIVÁLVIP csapata. Legyen az 1000 vagy több 10 000 fős rendezvény, Magyarországon ezen a területen piacvezetőnek számítunk.",
    },
    {
      body: "A FESZTIVÁLVIP mögött olyan cégek és csapat van, akik saját tervezésű installációkat biztosítanak ügyfeleiknek széles skálájú saját eszközparkkal.",
    },
  ]),
  "sigma-kontener": page("Sigma konténer", [
    {
      body: "SIGMA összecsukható konténer — tökéletesen alkalmas bármilyen rendezvény, építkezés során felmerülő iroda, öltöző, raktár, jegy- és elárusítóhely szállásmegoldásra.",
    },
    {
      body: "A panelek tetszés szerint kiszedhetők, kombinálhatók és cserélhetők. A konténer 2,4m x 3,0m alapterületű és 2,5m magas, 670kg súlyú. Légkondicionálható, fűthető, dekorálható és igény szerint bármely irányba sorolható.",
    },
    {
      body: "Szállítása akár 3,5t kisteherautóval is megoldható. Cégünk nemcsak a konténer bérbeadásával, de áramellátás, klimatizálás, berendezés, dekorálás terén is teljeskörű szolgáltatást nyújt.",
    },
  ], [], "marti.gyorgy@bbimmo.hu"),
}

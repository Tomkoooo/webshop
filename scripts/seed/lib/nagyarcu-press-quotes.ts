export type NagyarcuPressQuoteSeed = {
  name: string
  sourceUrl: string
  quote: string
}

/** „Rólunk mondták” — sajtóidézetek az Én, a nagyarcú kiadványról. */
export const nagyarcuPressQuotes: NagyarcuPressQuoteSeed[] = [
  {
    name: "IGN.hu",
    sourceUrl: "https://hu.ign.com/en-a-nagyarcu",
    quote:
      "Az Én, a nagyarcú nem valami ellenpropaganda-anyag (pláne, hogy független minden párttól és egyetlen forintnyi közpénz sincs benne), hanem inkább annak a bizonyítéka, hogy a képregény nem valami gyerekes marhaság, hanem egy komoly művészeti ág, ami igenis képes mély és összetett társadalmi problémákat is megmutatni, akár egyetlen szépen komponált képkockában.",
  },
  {
    name: "Mandiner",
    sourceUrl:
      "https://mandiner.hu/belfold/2026/05/orban-viktort-es-a-fideszt-kifigurazo-kepregeny-keszul",
    quote:
      "Az alkotók szerint az Én, a kétarcúra válaszoló mű nem tekinthető propagandaeszköznek.",
  },
  {
    name: "Gulyáságyú",
    sourceUrl: "https://gulyasagyu.media/2026/05/26/orba-viktor-kepregeny-en-a-nagyarcu/",
    quote:
      "Az alkotók hite szerint az „Én, a nagyarcú” nem fikció és nem propagandaeszköz, hanem egy vizuális krónika, művészi híradó, amely kommentár nélkül a kortárs magyar történelem pillanatait dokumentálja.",
  },
  {
    name: "Gsplus",
    sourceUrl:
      "https://www.gsplus.hu/velemeny/az-en-a-nagyarcu-megmutatja-hogyan-valaszol-a-kepregeny-a-propagandara-384186.html",
    quote:
      "Ez nem objektív történelemkönyv, és nem is kell annak lennie. Inkább közérzeti jegyzetfüzet, amelyben a düh, a gúny és a szakmai önérzet egyszerre dolgozik.",
  },
  {
    name: "Index",
    sourceUrl:
      "https://index.hu/kultur/2026/06/27/en-a-nagyarcu-kepregeny-rajz-grafika-orban-viktor-valasztas-arutluk-podcast/",
    quote:
      "az Én, a nagyarcú is kordokumentum. Képregényhez kevés, annak az állapotnak a rögzítésére elegendő, ami Magyarország társadalmi hangulatát és politikai történéseit az utóbbi hónapokban meghatározta.",
  },
  {
    name: "Kontroll",
    sourceUrl:
      "https://kontroll.hu/cikk/belfold/2026/06/26/en-a-nagyarcu-cimmel-jelent-meg-valasz-orbanek-ai-propagandajara",
    quote:
      "A hazai képregényalkotók közössége fontosnak tartotta, hogy hiteles ellenpéldát mutasson fel, mivel úgy vélték, az említett propagandatermék és annak kampánya méltatlan eszközként szolgált a hatalommal visszaélő döntéshozók kezében",
  },
  {
    name: "Kreatív",
    sourceUrl: "https://kreativ.hu/cikk/kepregeny-alkotok-valasza-a-kozelmult-ai-propagandajara",
    quote:
      "Az „Én, a nagyarcú” alkotói hangsúlyozzák: céljuk nem a direkt politizálás, hanem a képregény mint valódi, autonóm művészeti ág becsületének helyreállítása.",
  },
]

export const nagyarcuPressTestimonialsBlock = {
  id: "testimonials-press",
  type: "testimonials" as const,
  enabled: true,
  data: {
    title: "Rólunk mondták",
    subtitle: "A sajtó reagálása az Én, a nagyarcú kiadványra",
    items: nagyarcuPressQuotes.map((item) => ({
      quote: item.quote,
      name: item.name,
      role: "",
      sourceUrl: item.sourceUrl,
      rating: 5,
    })),
  },
}

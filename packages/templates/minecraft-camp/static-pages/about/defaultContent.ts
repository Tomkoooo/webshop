import { aboutSchema, type AboutContent } from "./schema"

export const aboutDefaultContent: AboutContent = aboutSchema.parse({
  hero: {
    title: "Rólunk",
    subtitle: "Független szakértők, akik a minőséget és az átláthatóságot képviselik.",
    image: "/generic-hero.svg",
  },
  story: {
    heading: "A történetünk",
    paragraphs: [
      "Akkor kezdtük, amikor a piac tele volt rossz minőségű, gyorsan elhasználódó termékekkel.",
      "Hiszünk abban, hogy a vásárlók megérdemlik az átlátható tájékoztatást és a tartós termékeket.",
    ],
  },
  highlights: [
    { title: "Kézzel válogatott", body: "Minden terméket személyesen tesztelünk, mielőtt a kínálatba kerülne." },
    { title: "Független raktár", body: "A saját raktárunkban dolgozó kollégák készítik elő a csomagokat." },
    { title: "Hosszú garancia", body: "Hivatalos forgalmazói garancia minden gyártott termékre." },
  ],
  team: [],
  cta: {
    label: "Lépj velünk kapcsolatba",
    href: "/#contact",
  },
  meta: {
    seoTitle: "Rólunk",
    seoDescription: "Független szakértők. A teljes történetünk.",
  },
})

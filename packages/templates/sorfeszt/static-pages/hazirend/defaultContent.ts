import type { HouseRulesContent } from "./schema"

export const houseRulesDefaultContent: HouseRulesContent = {
  title: "<p>Házirend</p>",
  subtitle: "<p>A fesztiválra belépéssel elfogadod az alábbiakat.</p>",
  body: `<h2>Korhatár</h2>
<p>A rendezvény 18 éven felülieknek szól. A belépéskor a szervező igazolványt kérhet.</p>
<h2>Jegyek</h2>
<p>A belépés csak érvényes napijeggyel, VIP jeggyel vagy asztalfoglalással lehetséges. A kóstolójegyek a választott csomag szerint járnak.</p>
<h2>Fogyasztás</h2>
<p>Alkoholt csak 18 éven felüliek fogyaszthatnak. A kóstolójegyek a helyszínen beválthatók.</p>
<h2>Magatartás</h2>
<p>Kérjük, viselkedj kulturáltan a többi vendéggel, a zenekarokkal és a személyzettel. A szervező a házirendet sértő vendéget a belépő megtérítése nélkül eltávolíthatja.</p>`,
  meta: {
    seoTitle: "Házirend — Sörfeszt",
    seoDescription: "Sörfeszt házirend: korhatár, jegyek, fogyasztás.",
  },
}

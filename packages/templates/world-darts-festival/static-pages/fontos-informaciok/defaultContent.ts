import type { ImportantInfoContent } from "./schema"

export const importantInfoDefaultContent: ImportantInfoContent = {
  title: "<p>Important information</p>",
  subtitle:
    "<p>Everything you need to know about registration, rules, playing format, and venue policies.</p>",
  body: `<h2>Registration</h2>
<p>Online registration is required for all tournament categories. Entry fees are non-refundable after the closing date unless the event is cancelled by the organizer.</p>
<h2>Playing format</h2>
<p>Match formats follow WDF regulations. Check your category sheet for leg counts and board assignments.</p>
<h2>What to bring</h2>
<ul>
<li>Valid photo ID</li>
<li>Your own darts (steel tip)</li>
<li>Confirmation email or booking reference</li>
</ul>`,
  meta: {
    seoTitle: "Important information — World Darts Festival",
    seoDescription: "Registration rules, playing format, and practical information for competitors.",
  },
}

/** Hungarian fallback — used only when no `page:fontos-informaciok@hu` document exists yet. */
export const importantInfoDefaultContentHu: ImportantInfoContent = {
  title: "<p>Fontos információk</p>",
  subtitle:
    "<p>Minden, amit a nevezésről, a szabályokról, a játékformátumról és a helyszíni tudnivalókról tudnod kell.</p>",
  body: `<h2>Nevezés</h2>
<p>Minden versenykategóriában online nevezés szükséges. A nevezési díj a jelentkezési határidő után nem visszatéríthető, kivéve, ha a szervező mondja le a rendezvényt.</p>
<h2>Játékformátum</h2>
<p>A mérkőzésformátumok a WDF szabályzatát követik. A legszámokat és a táblabeosztást a kategóriád táblázatában találod.</p>
<h2>Mit hozz magaddal</h2>
<ul>
<li>Érvényes fényképes igazolvány</li>
<li>Saját nyilaid (steel tip)</li>
<li>Visszaigazoló e-mail vagy foglalási hivatkozás</li>
</ul>`,
  meta: {
    seoTitle: "Fontos információk — World Darts Festival",
    seoDescription: "Nevezési szabályok, játékformátum és gyakorlati tudnivalók a versenyzők számára.",
  },
}

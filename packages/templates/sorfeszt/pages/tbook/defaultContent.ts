import type {
  TBookBookingContent,
  TBookListContent,
  TBookSuccessContent,
} from "./schemas"

export const tBookListDefaultContent: TBookListContent = {
  pageTitle: "Jegyek",
  pageIntro:
    "Válaszd ki a jegytípust és a napot, amikor jössz. A kártyákon látszik, mi jár a jeggyel — belépés, kóstolójegyek, VIP rész.",
  emptyTitle: "A jegyek hamarosan elérhetők",
  emptyBody:
    "Amint a tBook események közzé vannak téve, itt jelennek meg. Addig a főoldalon böngészheted a jegytípusokat.",
  bookCta: "Foglalás",
  perPerson: "/ jegy",
  perBooking: "/ foglalás",
  meta: { seoTitle: "Jegyek — Sörfeszt", seoDescription: "Napijegy, VIP és asztal a Sörfesztre." },
}

export const tBookBookingDefaultContent: TBookBookingContent = {
  stepTicket: "Jegy és nap",
  stepDetails: "Adataid",
  stepReview: "Fizetés",
  guestsLabel: "Jegyek száma",
  hotelLabel: "Szállás",
  hotelNone: "Csak jegy (szállás nélkül)",
  nightsLabel: "Éjszakák",
  roomTypeLabel: "Szobatípus",
  customerHeading: "Kapcsolattartó",
  customerHint: "A fizetést intéző személy — vele e-mailben vesszük fel a kapcsolatot.",
  attendeesHeading: "Jegyek adatai",
  attendeesHint: "Minden jegyhez név és e-mail kell.",
  quoteCta: "Áttekintés",
  payCta: "Tovább a fizetéshez",
  payLoading: "Átirányítás…",
  backLabel: "Vissza",
  nextLabel: "Tovább",
  reviewHeading: "Összegzés",
  totalLabel: "Összesen",
  loadingEvent: "Jegy betöltése…",
  eventError: "Nem sikerült betölteni ezt a jegyet.",
  meta: { seoTitle: "Foglalás — Sörfeszt", seoDescription: "" },
}

export const tBookSuccessDefaultContent: TBookSuccessContent = {
  loadingText: "Fizetés megerősítése…",
  successTitle: "Foglalás megerősítve!",
  successBody: "Köszönjük! Hamarosan érkezik a visszaigazoló e-mail. Hivatkozás: {bookingId}",
  successCta: "Vissza a főoldalra",
  errorBody:
    "Nem sikerült megerősíteni a fizetést. Ha megterhelték a kártyádat, írj nekünk a kapcsolatfelvételi űrlapon.",
  errorCta: "Főoldal",
  meta: { seoTitle: "Foglalás megerősítve", seoDescription: "" },
}

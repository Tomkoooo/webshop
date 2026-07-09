import type {
  TBookBookingContent,
  TBookListContent,
  TBookSuccessContent,
} from "./schemas"

export const tBookListDefaultContent: TBookListContent = {
  pageTitle: "Jegyek & események",
  pageIntro:
    "Válassz eseményt, add meg a résztvevők adatait, és fizess biztonságosan online. Szállás opcionálisan választható.",
  emptyTitle: "Jelenleg nincs elérhető esemény",
  emptyBody:
    "Az események hamarosan megjelennek. Nézz vissza később, vagy írj nekünk a kapcsolatfelvételi űrlapon.",
  bookCta: "Foglalás",
  perPerson: "/ fő",
  perBooking: "/ foglalás",
  meta: { seoTitle: "Jegyek", seoDescription: "" },
}

export const tBookBookingDefaultContent: TBookBookingContent = {
  stepTicket: "Jegy & szállás",
  stepDetails: "Adatok",
  stepReview: "Fizetés",
  guestsLabel: "Résztvevők száma",
  hotelLabel: "Szállás",
  hotelNone: "Csak jegy (szállás nélkül)",
  nightsLabel: "Éjszakák",
  roomTypeLabel: "Szobatípus",
  customerHeading: "Kapcsolattartó",
  customerHint:
    "A foglalást és a fizetést intéző személy — vele tartjuk a kapcsolatot emailben.",
  attendeesHeading: "Résztvevők adatai",
  attendeesHint: "Minden jegyhez külön adat szükséges.",
  quoteCta: "Áttekintés",
  payCta: "Tovább a fizetéshez",
  payLoading: "Átirányítás…",
  backLabel: "Vissza",
  nextLabel: "Tovább",
  reviewHeading: "Összegzés",
  totalLabel: "Összesen",
  loadingEvent: "Esemény betöltése…",
  eventError: "Nem sikerült betölteni az eseményt.",
  meta: { seoTitle: "Foglalás", seoDescription: "" },
}

export const tBookSuccessDefaultContent: TBookSuccessContent = {
  loadingText: "Fizetés ellenőrzése…",
  successTitle: "Sikeres foglalás!",
  successBody: "Köszönjük! Visszaigazolást küldünk emailben. Azonosító: {bookingId}",
  successCta: "Vissza a főoldalra",
  errorBody:
    "Nem sikerült megerősíteni a fizetést. Ha levonták az összeget, írj nekünk a kapcsolatfelvételi űrlapon.",
  errorCta: "Főoldal",
  meta: { seoTitle: "Sikeres foglalás", seoDescription: "" },
}

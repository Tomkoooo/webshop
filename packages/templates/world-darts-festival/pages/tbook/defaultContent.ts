import type {
  TBookBookingContent,
  TBookListContent,
  TBookSuccessContent,
} from "./schemas"

export const tBookListDefaultContent: TBookListContent = {
  pageTitle: "Entries & events",
  pageIntro:
    "Choose an event, enter participant details, and pay securely online. Accommodation is optional.",
  emptyTitle: "No events available right now",
  emptyBody:
    "Events will appear here soon. Check back later, or contact us via the contact form.",
  bookCta: "Book now",
  perPerson: "/ person",
  perBooking: "/ booking",
  meta: { seoTitle: "Entries", seoDescription: "" },
}

export const tBookBookingDefaultContent: TBookBookingContent = {
  stepTicket: "Entry & stay",
  stepDetails: "Your details",
  stepReview: "Payment",
  guestsLabel: "Number of entries",
  hotelLabel: "Accommodation",
  hotelNone: "Entry only (no accommodation)",
  nightsLabel: "Nights",
  roomTypeLabel: "Room type",
  customerHeading: "Contact person",
  customerHint:
    "The person handling this booking and payment — we will contact them by email.",
  attendeesHeading: "Participant details",
  attendeesHint: "Please fill in details for every guest included in this booking.",
  quoteCta: "Review",
  payCta: "Continue to payment",
  payLoading: "Redirecting…",
  backLabel: "Back",
  nextLabel: "Continue",
  reviewHeading: "Summary",
  totalLabel: "Total",
  loadingEvent: "Loading event…",
  eventError: "Could not load this event.",
  meta: { seoTitle: "Booking", seoDescription: "" },
}

export const tBookSuccessDefaultContent: TBookSuccessContent = {
  loadingText: "Confirming payment…",
  successTitle: "Booking confirmed!",
  successBody: "Thank you! A confirmation email is on its way. Reference: {bookingId}",
  successCta: "Back to home",
  errorBody:
    "We could not confirm the payment. If you were charged, please contact us via the contact form.",
  errorCta: "Home",
  meta: { seoTitle: "Booking confirmed", seoDescription: "" },
}

/** Hungarian fallbacks — used only when no `page:jegyek@hu` / `page:tbook-foglalas@hu` / `page:tbook-foglalas-siker@hu` document exists yet. */
export const tBookListDefaultContentHu: TBookListContent = {
  pageTitle: "Nevezés és események",
  pageIntro:
    "Válassz egy eseményt, add meg a résztvevők adatait, és fizess biztonságosan online. A szállás opcionális.",
  emptyTitle: "Jelenleg nincs elérhető esemény",
  emptyBody:
    "Hamarosan itt jelennek meg az események. Nézz vissza később, vagy vedd fel velünk a kapcsolatot a kapcsolatfelvételi űrlapon.",
  bookCta: "Foglalás most",
  perPerson: "/ fő",
  perBooking: "/ foglalás",
  meta: { seoTitle: "Nevezés", seoDescription: "" },
}

export const tBookBookingDefaultContentHu: TBookBookingContent = {
  stepTicket: "Nevezés és szállás",
  stepDetails: "Adataid",
  stepReview: "Fizetés",
  guestsLabel: "Nevezések száma",
  hotelLabel: "Szállás",
  hotelNone: "Csak nevezés (szállás nélkül)",
  nightsLabel: "Éjszakák száma",
  roomTypeLabel: "Szobatípus",
  customerHeading: "Kapcsolattartó",
  customerHint:
    "A foglalást és a fizetést intéző személy — vele e-mailben vesszük fel a kapcsolatot.",
  attendeesHeading: "Résztvevők adatai",
  attendeesHint: "Kérjük, add meg minden, a foglalásban szereplő résztvevő adatait.",
  quoteCta: "Áttekintés",
  payCta: "Tovább a fizetéshez",
  payLoading: "Átirányítás…",
  backLabel: "Vissza",
  nextLabel: "Tovább",
  reviewHeading: "Összegzés",
  totalLabel: "Összesen",
  loadingEvent: "Esemény betöltése…",
  eventError: "Nem sikerült betölteni ezt az eseményt.",
  meta: { seoTitle: "Foglalás", seoDescription: "" },
}

export const tBookSuccessDefaultContentHu: TBookSuccessContent = {
  loadingText: "Fizetés megerősítése…",
  successTitle: "Foglalás megerősítve!",
  successBody: "Köszönjük! Hamarosan érkezik egy visszaigazoló e-mail. Hivatkozás: {bookingId}",
  successCta: "Vissza a főoldalra",
  errorBody:
    "Nem sikerült megerősíteni a fizetést. Ha megterhelték a kártyádat, kérjük, vedd fel velünk a kapcsolatot a kapcsolatfelvételi űrlapon.",
  errorCta: "Főoldal",
  meta: { seoTitle: "Foglalás megerősítve", seoDescription: "" },
}

import { z } from "zod"

const metaSchema = z.object({
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
})

export const tBookListContentSchema = z.object({
  pageTitle: z.string().default("Jegyek & események"),
  pageIntro: z
    .string()
    .default(
      "Válassz eseményt, add meg a résztvevők adatait, és fizess biztonságosan online. Szállás opcionálisan választható."
    ),
  emptyTitle: z.string().default("Jelenleg nincs elérhető esemény"),
  emptyBody: z
    .string()
    .default("Az események hamarosan megjelennek. Nézz vissza később, vagy írj nekünk a kapcsolatfelvételi űrlapon."),
  bookCta: z.string().default("Foglalás"),
  perPerson: z.string().default("/ fő"),
  perBooking: z.string().default("/ foglalás"),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export const tBookBookingContentSchema = z.object({
  stepTicket: z.string().default("Jegy & szállás"),
  stepDetails: z.string().default("Adatok"),
  stepReview: z.string().default("Fizetés"),
  guestsLabel: z.string().default("Résztvevők száma"),
  hotelLabel: z.string().default("Szállás"),
  hotelNone: z.string().default("Csak jegy (szállás nélkül)"),
  nightsLabel: z.string().default("Éjszakák"),
  roomTypeLabel: z.string().default("Szobatípus"),
  customerHeading: z.string().default("Kapcsolattartó"),
  customerHint: z
    .string()
    .default("A foglalást és a fizetést intéző személy — vele tartjuk a kapcsolatot emailben."),
  attendeesHeading: z.string().default("Résztvevők adatai"),
  attendeesHint: z.string().default("Minden jegyhez külön adat szükséges."),
  quoteCta: z.string().default("Áttekintés"),
  payCta: z.string().default("Tovább a fizetéshez"),
  payLoading: z.string().default("Átirányítás…"),
  backLabel: z.string().default("Vissza"),
  nextLabel: z.string().default("Tovább"),
  reviewHeading: z.string().default("Összegzés"),
  totalLabel: z.string().default("Összesen"),
  loadingEvent: z.string().default("Esemény betöltése…"),
  eventError: z.string().default("Nem sikerült betölteni az eseményt."),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export const tBookSuccessContentSchema = z.object({
  loadingText: z.string().default("Fizetés ellenőrzése…"),
  successTitle: z.string().default("Sikeres foglalás!"),
  successBody: z
    .string()
    .default("Köszönjük! Visszaigazolást küldünk emailben. Azonosító: {bookingId}"),
  successCta: z.string().default("Vissza a főoldalra"),
  errorBody: z
    .string()
    .default(
      "Nem sikerült megerősíteni a fizetést. Ha levonták az összeget, írj nekünk a kapcsolatfelvételi űrlapon."
    ),
  errorCta: z.string().default("Főoldal"),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export type TBookListContent = z.infer<typeof tBookListContentSchema>
export type TBookBookingContent = z.infer<typeof tBookBookingContentSchema>
export type TBookSuccessContent = z.infer<typeof tBookSuccessContentSchema>

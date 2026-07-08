import { z } from "zod"

const metaSchema = z.object({
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
})

export const campListContentSchema = z.object({
  pageTitle: z.string().default("Jegyvásárlás"),
  pageIntro: z
    .string()
    .default(
      "Válassz turnust és jegytípust, add meg a vásárló és gyerek adatait, majd fizesd ki a foglalást biztonságosan, on-line."
    ),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export const campBookingContentSchema = z.object({
  stepOffers: z.string().default("Ajánlatok"),
  stepDetails: z.string().default("Adatok megadása"),
  stepReview: z.string().default("Áttekintés"),
  ticketsHeading: z.string().default("Jegyek, bérletek"),
  ticketTypeLabel: z.string().default("Jegytípus"),
  childCountLabel: z.string().default("Gyerekek száma"),
  addonsHint: z
    .string()
    .default("Kiegészítők (pl. laptop bérlés) a következő lépésben választhatók gyerekenként."),
  buyerHeading: z.string().default("Kapcsolattartó"),
  childrenHeading: z.string().default("Gyerekek adatai"),
  payCta: z.string().default("Tovább a fizetéshez"),
  reviewHeading: z.string().default("Áttekintés"),
  payStripeCta: z.string().default("Fizetés Stripe-on"),
  payStripeLoading: z.string().default("Átirányítás…"),
  backLabel: z.string().default("Vissza"),
  nextLabel: z.string().default("Tovább"),
  venueAddress: z
    .string()
    .default("Récsei Center Remíz Darts klub, Budapest, Istvánmezei út 6., 1146"),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export const campSuccessContentSchema = z.object({
  loadingText: z.string().default("Fizetés ellenőrzése…"),
  successTitle: z.string().default("Sikeres foglalás!"),
  successBody: z
    .string()
    .default("Köszönjük! Visszaigazolást küldünk emailben. Azonosító: {registrationId}"),
  successCta: z.string().default("Vissza a főoldalra"),
  errorBody: z
    .string()
    .default(
      "Nem sikerült megerősíteni a fizetést. Ha levonták az összeget, írjon nekünk."
    ),
  errorCta: z.string().default("Főoldal"),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export type CampListContent = z.infer<typeof campListContentSchema>
export type CampBookingContent = z.infer<typeof campBookingContentSchema>
export type CampSuccessContent = z.infer<typeof campSuccessContentSchema>

import { z } from "zod"

const metaSchema = z.object({
  seoTitle: z.string().default(""),
  seoDescription: z.string().default(""),
})

export const tBookListContentSchema = z.object({
  pageTitle: z.string().default("Entries & events"),
  pageIntro: z
    .string()
    .default(
      "Choose an event, enter participant details, and pay securely online. Accommodation is optional."
    ),
  emptyTitle: z.string().default("No events available right now"),
  emptyBody: z
    .string()
    .default("Events will appear here soon. Check back later, or contact us via the contact form."),
  bookCta: z.string().default("Book now"),
  perPerson: z.string().default("/ person"),
  perBooking: z.string().default("/ booking"),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export const tBookBookingContentSchema = z.object({
  stepTicket: z.string().default("Entry & stay"),
  stepDetails: z.string().default("Your details"),
  stepReview: z.string().default("Payment"),
  guestsLabel: z.string().default("Number of entries"),
  hotelLabel: z.string().default("Accommodation"),
  hotelNone: z.string().default("Entry only (no accommodation)"),
  nightsLabel: z.string().default("Nights"),
  roomTypeLabel: z.string().default("Room type"),
  customerHeading: z.string().default("Contact person"),
  customerHint: z
    .string()
    .default("The person handling this booking and payment — we will contact them by email."),
  attendeesHeading: z.string().default("Participant details"),
  attendeesHint: z.string().default("Please fill in details for every guest included in this booking."),
  quoteCta: z.string().default("Review"),
  payCta: z.string().default("Continue to payment"),
  payLoading: z.string().default("Redirecting…"),
  backLabel: z.string().default("Back"),
  nextLabel: z.string().default("Continue"),
  reviewHeading: z.string().default("Summary"),
  totalLabel: z.string().default("Total"),
  loadingEvent: z.string().default("Loading event…"),
  eventError: z.string().default("Could not load this event."),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export const tBookSuccessContentSchema = z.object({
  loadingText: z.string().default("Confirming payment…"),
  successTitle: z.string().default("Booking confirmed!"),
  successBody: z
    .string()
    .default("Thank you! A confirmation email is on its way. Reference: {bookingId}"),
  successCta: z.string().default("Back to home"),
  errorBody: z
    .string()
    .default(
      "We could not confirm the payment. If you were charged, please contact us via the contact form."
    ),
  errorCta: z.string().default("Home"),
  meta: metaSchema.default({ seoTitle: "", seoDescription: "" }),
})

export type TBookListContent = z.infer<typeof tBookListContentSchema>
export type TBookBookingContent = z.infer<typeof tBookBookingContentSchema>
export type TBookSuccessContent = z.infer<typeof tBookSuccessContentSchema>

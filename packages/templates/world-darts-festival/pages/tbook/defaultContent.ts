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

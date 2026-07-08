import {
  campBookingContentSchema,
  campListContentSchema,
  campSuccessContentSchema,
  type CampBookingContent,
  type CampListContent,
  type CampSuccessContent,
} from "./schemas"

export const campListDefaultContent: CampListContent = campListContentSchema.parse({})
export const campBookingDefaultContent: CampBookingContent = campBookingContentSchema.parse({})
export const campSuccessDefaultContent: CampSuccessContent = campSuccessContentSchema.parse({})

/** @deprecated Use campBookingDefaultContent — kept for plugin default imports */
export const campCheckoutCopy = {
  pageTitle: campListDefaultContent.pageTitle,
  pageIntro: campListDefaultContent.pageIntro,
  stepOffers: campBookingDefaultContent.stepOffers,
  stepDetails: campBookingDefaultContent.stepDetails,
  stepReview: campBookingDefaultContent.stepReview,
  ticketsHeading: campBookingDefaultContent.ticketsHeading,
  ticketTypeLabel: campBookingDefaultContent.ticketTypeLabel,
  childCountLabel: campBookingDefaultContent.childCountLabel,
  addonsHint: campBookingDefaultContent.addonsHint,
  buyerHeading: campBookingDefaultContent.buyerHeading,
  childrenHeading: campBookingDefaultContent.childrenHeading,
  payCta: campBookingDefaultContent.payCta,
} as const

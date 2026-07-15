/**
 * tBook pricing engine types.
 *
 * Every hotel stores a flexible option schema (`TBookOptionDef[]`): key-value
 * selectors with add-on pricing. The engine is a pure function over this
 * schema, so admin live-preview, the public quote API, and the checkout flow
 * all share the exact same calculation.
 */

import type { TBookPriceBasis } from "./vat"

export type TBookVatPricing = {
  /** Whether stored amounts are net or gross HUF. Defaults to gross for legacy rows. */
  priceBasis?: TBookPriceBasis
  vatPercent?: number
}

export type TBookPriceMode =
  | "fixed"
  | "per_person"
  | "per_night"
  | "per_person_per_night"
  /** Percentage of the accommodation base amount. */
  | "percent"

export type TBookOptionType = "select" | "multiselect" | "number" | "checkbox"

export type TBookOptionChoice = {
  value: string
  label: string
  priceHuf: number
  priceMode: TBookPriceMode
}

export type TBookOptionDependency = {
  /** Key of another option this one depends on. */
  key: string
  /** The option applies only when the dependency's value is one of these. */
  values: string[]
}

export type TBookOptionDef = {
  /** Machine key, e.g. `room_type`, `meals`, `accessibility`. */
  key: string
  /** Admin/customer facing label, e.g. "Étkezés". */
  label: string
  type: TBookOptionType
  required?: boolean
  defaultValue?: string | number | boolean | string[] | null
  /** For select / multiselect. */
  choices?: TBookOptionChoice[]
  /** For number / checkbox: price of one unit. */
  unitPriceHuf?: number
  /** For number / checkbox: how the unit price scales. */
  priceMode?: TBookPriceMode
  /** For number. */
  min?: number
  max?: number
  dependsOn?: TBookOptionDependency | null
  sortOrder?: number
}

export type TBookBaseRateMode =
  | "per_person_per_night"
  | "per_night"
  | "per_person"
  | "per_booking"

export type TBookAccommodationMode = "room_nights" | "packages" | "both"

export type TBookRoomType = {
  key: string
  label: string
  /** Base rate per guest per night (net or gross per hotel priceBasis). */
  baseRateHuf: number
  sortOrder?: number
}

/** Fixed stay package, e.g. 3 nights in a room type for a flat price. */
export type TBookPackageDeal = {
  key: string
  label: string
  nights: number
  priceHuf: number
  /** When set, package applies only to this room type. */
  roomTypeKey?: string | null
  sortOrder?: number
}

/** Single extras block shown to guests (title + description + option fields). */
export type TBookExtrasSection = {
  label: string
  description?: string
  options: TBookOptionDef[]
}

/** @deprecated Migrated to extrasSection on read via normalizeHotelPricing */
export type TBookAddonGroup = {
  key: string
  label: string
  description?: string
  sortOrder?: number
  options: TBookOptionDef[]
}

export type TBookHotelPricing = TBookVatPricing & {
  /** How guests pick accommodation: per-night rooms, fixed packages, or both. */
  accommodationMode?: TBookAccommodationMode
  roomTypes: TBookRoomType[]
  packages?: TBookPackageDeal[]
  extrasSection?: TBookExtrasSection | null
  /** @deprecated Migrated to extrasSection — kept for legacy reads */
  addonGroups?: TBookAddonGroup[]
  /** @deprecated Legacy flat pricing — migrated on read via normalizeHotelPricing */
  baseRateHuf?: number
  baseRateMode?: TBookBaseRateMode
  options?: TBookOptionDef[]
}

/** @deprecated Use TBookHotelPricing */
export type TBookAccommodationPricing = TBookHotelPricing

export type TBookTicketFeeMode = "per_person" | "per_booking" | "per_team"

export type TBookSelectionValue = string | number | boolean | string[]
export type TBookSelections = Record<string, TBookSelectionValue>

export type TBookPriceLine = {
  key: string
  label: string
  amountHuf: number
}

export type TBookPriceQuote = {
  guests: number
  nights: number
  ticketSubtotalHuf: number
  accommodationBaseHuf: number
  accommodationOptionsHuf: number
  accommodationSubtotalHuf: number
  totalHuf: number
  lines: TBookPriceLine[]
}

export type TBookQuoteInput = {
  /** Event base ticket fee (stored net or gross per ticketPriceBasis). */
  ticketFeeHuf: number
  ticketFeeMode?: TBookTicketFeeMode
  ticketPriceBasis?: TBookPriceBasis
  ticketVatPercent?: number
  guests: number
  /** Required when accommodation is selected. */
  nights?: number
  /** Omit for ticket-only bookings — accommodation is optional per booking. */
  accommodation?: TBookAccommodationPricing | null
  /** Group-level booking options (merged with hotel options when both exist). */
  groupOptions?: TBookOptionDef[]
  groupPriceBasis?: TBookPriceBasis
  groupVatPercent?: number
  selections?: TBookSelections | null
}

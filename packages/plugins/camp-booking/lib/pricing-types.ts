import type { CampPricingMode } from "../models/CampTicketType"

export type CampTicketPriceInput = {
  name: string
  description?: string
  priceHuf: number
  pricingMode: CampPricingMode
  kind?: "base" | "addon"
  earlyBirdEndsAt?: Date | string | null
  earlyBirdPriceHuf?: number | null
  earlyBirdDiscountPercent?: number | null
}

export type CampPricingSettingsInput = {
  multiChildDiscountPercent?: number
  multiChildMinCount?: number
  siblingDiscountPercent?: number
  siblingMatchByLastName?: boolean
}

export type CampChildPriceInput = {
  name: string
  lastName?: string
  laptopRental?: boolean
  addonTicketIds?: string[]
}

export type CampOrderLine = {
  label: string
  amountHuf: number
}

export type CampOrderTotal = {
  campSubtotalHuf: number
  earlyBirdSavingsHuf: number
  familyDiscountHuf: number
  addonsHuf: number
  totalHuf: number
  effectiveUnitPriceHuf: number
  familyDiscountPercent: number
  lines: CampOrderLine[]
}

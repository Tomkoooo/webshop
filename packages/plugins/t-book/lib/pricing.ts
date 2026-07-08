import type {
  TBookBaseRateMode,
  TBookOptionChoice,
  TBookOptionDef,
  TBookPriceLine,
  TBookPriceMode,
  TBookPriceQuote,
  TBookQuoteInput,
  TBookSelectionValue,
  TBookSelections,
} from "./pricing-types"
import type { TBookPriceBasis } from "./vat"
import { toGrossHuf, TBOOK_DEFAULT_VAT_PERCENT } from "./vat"
import { mergeOptionSchemas } from "./option-merge"
import {
  ROOM_TYPE_SELECTION_KEY,
  flattenAddonOptions,
  findRoomType,
  normalizeHotelPricing,
} from "./hotel-pricing"

function roundHuf(amount: number): number {
  return Math.round(Number.isFinite(amount) ? amount : 0)
}

function basisOf(
  priceBasis: TBookPriceBasis | undefined,
  fallback: TBookPriceBasis = "gross"
): TBookPriceBasis {
  return priceBasis ?? fallback
}

function vatOf(vatPercent: number | undefined): number {
  return vatPercent ?? TBOOK_DEFAULT_VAT_PERCENT
}

function grossChoicePrice(
  choice: TBookOptionChoice,
  priceBasis: TBookPriceBasis,
  vatPercent: number
): TBookOptionChoice {
  return {
    ...choice,
    priceHuf: toGrossHuf(choice.priceHuf, priceBasis, vatPercent),
  }
}

function withGrossOptionPrices(
  option: TBookOptionDef,
  priceBasis: TBookPriceBasis,
  vatPercent: number
): TBookOptionDef {
  return {
    ...option,
    choices: option.choices?.map((c) => grossChoicePrice(c, priceBasis, vatPercent)),
    unitPriceHuf:
      option.unitPriceHuf != null
        ? toGrossHuf(option.unitPriceHuf, priceBasis, vatPercent)
        : option.unitPriceHuf,
  }
}

function scaleByMode(
  unitHuf: number,
  mode: TBookPriceMode,
  guests: number,
  nights: number,
  accommodationBaseHuf: number
): number {
  switch (mode) {
    case "per_person":
      return unitHuf * guests
    case "per_night":
      return unitHuf * nights
    case "per_person_per_night":
      return unitHuf * guests * nights
    case "percent":
      return (accommodationBaseHuf * unitHuf) / 100
    case "fixed":
    default:
      return unitHuf
  }
}

export function calculateAccommodationBaseHuf(
  baseRateHuf: number,
  baseRateMode: TBookBaseRateMode,
  guests: number,
  nights: number
): number {
  const rate = Math.max(0, baseRateHuf)
  switch (baseRateMode) {
    case "per_person_per_night":
      return roundHuf(rate * guests * nights)
    case "per_night":
      return roundHuf(rate * nights)
    case "per_person":
      return roundHuf(rate * guests)
    case "per_booking":
    default:
      return roundHuf(rate)
  }
}

/** True when the option is visible/applicable given the current selections. */
export function isOptionApplicable(
  option: TBookOptionDef,
  selections: TBookSelections
): boolean {
  const dep = option.dependsOn
  if (!dep || !dep.key || dep.values.length === 0) return true
  const current = selections[dep.key]
  if (current == null) return false
  const values = Array.isArray(current) ? current.map(String) : [String(current)]
  return values.some((v) => dep.values.includes(v))
}

export function resolveSelectionValue(
  option: TBookOptionDef,
  selections: TBookSelections
): TBookSelectionValue | null {
  if (Object.prototype.hasOwnProperty.call(selections, option.key)) {
    return selections[option.key] ?? null
  }
  if (option.defaultValue != null) return option.defaultValue
  return null
}

function findChoice(option: TBookOptionDef, value: string): TBookOptionChoice | null {
  return option.choices?.find((c) => c.value === value) ?? null
}

export type TBookSelectionError = { key: string; message: string }

export function validateHotelSelections(
  pricing: import("./pricing-types").TBookHotelPricing,
  selections: TBookSelections
): TBookSelectionError[] {
  const normalized = normalizeHotelPricing(pricing)
  const errors: TBookSelectionError[] = []

  const roomKey = selections[ROOM_TYPE_SELECTION_KEY]
  if (typeof roomKey !== "string" || !findRoomType(normalized, roomKey)) {
    errors.push({
      key: ROOM_TYPE_SELECTION_KEY,
      message: "Kötelező szobatípus választás",
    })
  }

  const addonOptions = flattenAddonOptions(normalized)
  errors.push(...validateSelections(addonOptions, selections))
  return errors
}

/**
 * Validates customer selections against a hotel option schema.
 * Unknown keys, missing required options, out-of-range numbers and
 * unknown choice values are all rejected — the API never trusts client prices.
 */
export function validateSelections(
  options: TBookOptionDef[],
  selections: TBookSelections
): TBookSelectionError[] {
  const errors: TBookSelectionError[] = []
  const known = new Set(options.map((o) => o.key))

  for (const key of Object.keys(selections)) {
    if (key === ROOM_TYPE_SELECTION_KEY) continue
    if (!known.has(key)) {
      errors.push({ key, message: `Ismeretlen opció: ${key}` })
    }
  }

  for (const option of options) {
    if (!isOptionApplicable(option, selections)) continue
    const value = resolveSelectionValue(option, selections)

    if (value == null) {
      if (option.required) {
        errors.push({ key: option.key, message: `Kötelező opció: ${option.label}` })
      }
      continue
    }

    switch (option.type) {
      case "select": {
        if (typeof value !== "string" || !findChoice(option, value)) {
          errors.push({ key: option.key, message: `Érvénytelen érték: ${option.label}` })
        }
        break
      }
      case "multiselect": {
        const values = Array.isArray(value) ? value : null
        if (!values || values.some((v) => !findChoice(option, String(v)))) {
          errors.push({ key: option.key, message: `Érvénytelen érték: ${option.label}` })
        }
        break
      }
      case "number": {
        const n = Number(value)
        if (!Number.isFinite(n)) {
          errors.push({ key: option.key, message: `Szám szükséges: ${option.label}` })
          break
        }
        if (option.min != null && n < option.min) {
          errors.push({ key: option.key, message: `${option.label}: minimum ${option.min}` })
        }
        if (option.max != null && n > option.max) {
          errors.push({ key: option.key, message: `${option.label}: maximum ${option.max}` })
        }
        break
      }
      case "checkbox": {
        if (typeof value !== "boolean") {
          errors.push({ key: option.key, message: `Érvénytelen érték: ${option.label}` })
        }
        break
      }
    }
  }

  return errors
}

function optionAmountHuf(
  option: TBookOptionDef,
  value: TBookSelectionValue,
  guests: number,
  nights: number,
  accommodationBaseHuf: number
): { amountHuf: number; detail: string } | null {
  switch (option.type) {
    case "select": {
      const choice = findChoice(option, String(value))
      if (!choice || choice.priceHuf === 0) {
        return choice ? { amountHuf: 0, detail: choice.label } : null
      }
      return {
        amountHuf: scaleByMode(choice.priceHuf, choice.priceMode, guests, nights, accommodationBaseHuf),
        detail: choice.label,
      }
    }
    case "multiselect": {
      const values = Array.isArray(value) ? value : []
      let amount = 0
      const labels: string[] = []
      for (const v of values) {
        const choice = findChoice(option, String(v))
        if (!choice) continue
        amount += scaleByMode(choice.priceHuf, choice.priceMode, guests, nights, accommodationBaseHuf)
        labels.push(choice.label)
      }
      if (labels.length === 0) return null
      return { amountHuf: amount, detail: labels.join(", ") }
    }
    case "number": {
      const quantity = Math.max(0, Number(value) || 0)
      if (quantity === 0) return null
      const unit = option.unitPriceHuf ?? 0
      const scaled = scaleByMode(unit, option.priceMode ?? "fixed", guests, nights, accommodationBaseHuf)
      return { amountHuf: scaled * quantity, detail: String(quantity) }
    }
    case "checkbox": {
      if (value !== true) return null
      const unit = option.unitPriceHuf ?? 0
      return {
        amountHuf: scaleByMode(unit, option.priceMode ?? "fixed", guests, nights, accommodationBaseHuf),
        detail: "Igen",
      }
    }
    default:
      return null
  }
}

/**
 * Core tBook pricing engine (pure).
 *
 * total = event ticket fee (+ accommodation base + option add-ons when a hotel
 * is selected). Ticket-only bookings simply omit `accommodation`.
 */
export function calculateBookingQuote(input: TBookQuoteInput): TBookPriceQuote {
  const guests = Math.max(1, Math.floor(input.guests || 1))
  const nights = Math.max(0, Math.floor(input.nights ?? 0))
  const ticketFeeMode = input.ticketFeeMode ?? "per_person"

  const ticketUnitGross = toGrossHuf(
    Math.max(0, input.ticketFeeHuf),
    basisOf(input.ticketPriceBasis, "gross"),
    vatOf(input.ticketVatPercent)
  )

  const ticketSubtotalHuf = roundHuf(
    ticketFeeMode === "per_booking" ? ticketUnitGross : ticketUnitGross * guests
  )

  const lines: TBookPriceLine[] = [
    {
      key: "ticket",
      label: ticketFeeMode === "per_booking" ? "Belépőjegy" : `Belépőjegy × ${guests} fő`,
      amountHuf: ticketSubtotalHuf,
    },
  ]

  let accommodationBaseHuf = 0
  let accommodationOptionsHuf = 0

  const groupBasis = basisOf(input.groupPriceBasis, "gross")
  const groupVat = vatOf(input.groupVatPercent)
  const groupOptionsGross = (input.groupOptions ?? []).map((o) =>
    withGrossOptionPrices(o, groupBasis, groupVat)
  )

  let mergedOptions: TBookOptionDef[] = groupOptionsGross

  if (input.accommodation) {
    const acc = normalizeHotelPricing(input.accommodation)
    const accBasis = basisOf(acc.priceBasis, "gross")
    const accVat = vatOf(acc.vatPercent)
    const effectiveNights = Math.max(1, nights)
    const selections = input.selections ?? {}

    const roomTypeKey = String(selections[ROOM_TYPE_SELECTION_KEY] ?? "")
    const roomType = findRoomType(acc, roomTypeKey)
    if (roomType) {
      const roomGross = toGrossHuf(roomType.baseRateHuf, accBasis, accVat)
      accommodationBaseHuf = roundHuf(roomGross * guests * effectiveNights)
      lines.push({
        key: "accommodation_base",
        label: `${roomType.label} (${guests} fő, ${effectiveNights} éj)`,
        amountHuf: accommodationBaseHuf,
      })
    }

    const hotelAddonsGross = flattenAddonOptions(acc).map((o) =>
      withGrossOptionPrices(o, accBasis, accVat)
    )
    mergedOptions = mergeOptionSchemas(groupOptionsGross, hotelAddonsGross)
  }

  const selections = input.selections ?? {}
  const effectiveNights = input.accommodation ? Math.max(1, nights) : nights
  const optionBaseHuf = accommodationBaseHuf || ticketSubtotalHuf
  const sorted = [...mergedOptions].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))

  for (const option of sorted) {
    if (!isOptionApplicable(option, selections)) continue
    const value = resolveSelectionValue(option, selections)
    if (value == null) continue
    const result = optionAmountHuf(option, value, guests, effectiveNights, optionBaseHuf)
    if (!result) continue
    const amountHuf = roundHuf(result.amountHuf)
    accommodationOptionsHuf += amountHuf
    if (amountHuf !== 0) {
      lines.push({
        key: `option:${option.key}`,
        label: `${option.label}: ${result.detail}`,
        amountHuf,
      })
    }
  }

  const accommodationSubtotalHuf = accommodationBaseHuf + accommodationOptionsHuf
  return {
    guests,
    nights: input.accommodation ? Math.max(1, nights) : nights,
    ticketSubtotalHuf,
    accommodationBaseHuf,
    accommodationOptionsHuf,
    accommodationSubtotalHuf,
    totalHuf: ticketSubtotalHuf + accommodationSubtotalHuf,
    lines,
  }
}

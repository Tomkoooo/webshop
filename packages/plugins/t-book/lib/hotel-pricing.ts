import type {
  TBookAddonGroup,
  TBookHotelPricing,
  TBookOptionDef,
  TBookRoomType,
} from "./pricing-types"

/** Selection key for the chosen room type (matches `TBookRoomType.key`). */
export const ROOM_TYPE_SELECTION_KEY = "room_type"

export function slugifyHotelKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
}

function uniqueKey(base: string, used: Set<string>, fallback: string): string {
  const slug = slugifyHotelKey(base) || fallback
  if (!used.has(slug)) {
    used.add(slug)
    return slug
  }
  let index = 2
  while (used.has(`${slug}_${index}`)) index += 1
  const key = `${slug}_${index}`
  used.add(key)
  return key
}

function resolveKey(
  label: string,
  currentKey: string | undefined,
  used: Set<string>,
  fallback: string
): string {
  if (currentKey && /^[a-z0-9_]+$/.test(currentKey) && !used.has(currentKey)) {
    used.add(currentKey)
    return currentKey
  }
  return uniqueKey(label, used, fallback)
}

function resolveChoiceValue(
  label: string,
  currentValue: string | undefined,
  used: Set<string>,
  fallback: string
): string {
  if (currentValue && /^[a-z0-9_]+$/.test(currentValue) && !used.has(currentValue)) {
    used.add(currentValue)
    return currentValue
  }
  return uniqueKey(label, used, fallback)
}

/**
 * Assigns stable internal keys from labels before save. Moderators only edit
 * names; keys are generated automatically and kept unique within a hotel.
 */
export function assignPricingKeys(pricing: TBookHotelPricing): TBookHotelPricing {
  const roomKeys = new Set<string>()
  const roomTypes = pricing.roomTypes.map((room, index) => ({
    ...room,
    key: resolveKey(room.label, room.key, roomKeys, `room_${index + 1}`),
  }))

  const groupKeys = new Set<string>()
  const optionKeys = new Set<string>()

  const addonGroups = pricing.addonGroups.map((group, groupIndex) => {
    const groupKey = resolveKey(group.label, group.key, groupKeys, `section_${groupIndex + 1}`)
    const options = group.options.map((option, optionIndex) => {
      const optionKey = resolveKey(
        option.label,
        option.key,
        optionKeys,
        `field_${groupIndex + 1}_${optionIndex + 1}`
      )
      const choiceValues = new Set<string>()
      const choices = option.choices?.map((choice, choiceIndex) => ({
        ...choice,
        value: resolveChoiceValue(
          choice.label,
          choice.value,
          choiceValues,
          `choice_${choiceIndex + 1}`
        ),
      }))
      return { ...option, key: optionKey, choices }
    })
    return { ...group, key: groupKey, options }
  })

  return { ...pricing, roomTypes, addonGroups }
}

/** Normalizes legacy flat `baseRate + options[]` into room types + grouped add-ons. */
export function normalizeHotelPricing(raw: TBookHotelPricing): TBookHotelPricing {
  if (raw.roomTypes?.length) {
    return {
      priceBasis: raw.priceBasis ?? "net",
      vatPercent: raw.vatPercent ?? 27,
      roomTypes: raw.roomTypes,
      addonGroups: raw.addonGroups ?? [],
    }
  }

  const legacyBase = raw.baseRateHuf ?? 0
  const legacyOptions = raw.options ?? []
  const roomTypeOption = legacyOptions.find((o) => o.key === ROOM_TYPE_SELECTION_KEY)
  const otherOptions = legacyOptions.filter((o) => o.key !== ROOM_TYPE_SELECTION_KEY)

  let roomTypes: TBookRoomType[] = []
  if (roomTypeOption?.choices?.length) {
    roomTypes = roomTypeOption.choices.map((choice, index) => ({
      key: choice.value || slugifyHotelKey(choice.label) || `room_${index}`,
      label: choice.label,
      baseRateHuf: legacyBase + (choice.priceHuf ?? 0),
      sortOrder: index,
    }))
  } else {
    roomTypes = [
      {
        key: "standard",
        label: "Standard szoba",
        baseRateHuf: legacyBase,
        sortOrder: 0,
      },
    ]
  }

  const addonGroups: TBookAddonGroup[] =
    otherOptions.length > 0
      ? [
          {
            key: "extras",
            label: "Felárak & extrák",
            sortOrder: 0,
            options: otherOptions,
          },
        ]
      : []

  return {
    priceBasis: raw.priceBasis ?? "net",
    vatPercent: raw.vatPercent ?? 27,
    roomTypes,
    addonGroups,
  }
}

export function flattenAddonOptions(pricing: TBookHotelPricing): TBookOptionDef[] {
  const normalized = normalizeHotelPricing(pricing)
  return normalized.addonGroups
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .flatMap((group) =>
      [...group.options].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    )
}

export function findRoomType(
  pricing: TBookHotelPricing,
  roomTypeKey: string
): TBookRoomType | null {
  const normalized = normalizeHotelPricing(pricing)
  return normalized.roomTypes.find((r) => r.key === roomTypeKey) ?? null
}

/** Rough count of distinct customer configuration paths (for admin UX). */
function choicePaths(option: TBookOptionDef): number {
  switch (option.type) {
    case "select":
      return Math.max(1, option.choices?.length ?? 1)
    case "multiselect": {
      const n = option.choices?.length ?? 0
      return n === 0 ? 1 : n + 1
    }
    case "number": {
      const min = option.min ?? 0
      const max = option.max ?? min
      return Math.max(1, max - min + 1)
    }
    case "checkbox":
      return 2
    default:
      return 1
  }
}

export type HotelComplexityStats = {
  roomTypeCount: number
  addonGroupCount: number
  addonOptionCount: number
  /** room types × product(add-on branch counts) */
  estimatedBookingPaths: number
}

export function hotelComplexityStats(pricing: TBookHotelPricing): HotelComplexityStats {
  const normalized = normalizeHotelPricing(pricing)
  const addons = flattenAddonOptions(normalized)
  const addonPaths = addons.reduce((acc, option) => acc * choicePaths(option), 1)
  const roomTypeCount = Math.max(1, normalized.roomTypes.length)
  return {
    roomTypeCount: normalized.roomTypes.length,
    addonGroupCount: normalized.addonGroups.length,
    addonOptionCount: addons.length,
    estimatedBookingPaths: roomTypeCount * addonPaths,
  }
}

export function eventHotelsComplexitySummary(
  hotels: Array<{ pricing: TBookHotelPricing }>
): {
  hotelCount: number
  totalRoomTypes: number
  totalAddonGroups: number
  totalEstimatedPaths: number
} {
  let totalRoomTypes = 0
  let totalAddonGroups = 0
  let totalEstimatedPaths = 0
  for (const hotel of hotels) {
    const stats = hotelComplexityStats(hotel.pricing)
    totalRoomTypes += stats.roomTypeCount
    totalAddonGroups += stats.addonGroupCount
    totalEstimatedPaths += stats.estimatedBookingPaths
  }
  return {
    hotelCount: hotels.length,
    totalRoomTypes,
    totalAddonGroups,
    totalEstimatedPaths,
  }
}

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

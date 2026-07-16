import type {
  TBookAccommodationMode,
  TBookExtrasSection,
  TBookHotelPricing,
  TBookOptionDef,
  TBookPackageDeal,
  TBookRoomType,
} from "./pricing-types"

/** Selection key for the chosen room type (matches `TBookRoomType.key`). */
export const ROOM_TYPE_SELECTION_KEY = "room_type"

/** Selection key for an optional fixed package deal instead of per-night pricing. */
export const PACKAGE_DEAL_SELECTION_KEY = "package_deal"

/** Multi-package plan: package key → unit count (mixed room types). */
export const PACKAGE_UNITS_SELECTION_KEY = "package_units"

export const ACCOMMODATION_MODE_LABELS: Record<TBookAccommodationMode, string> = {
  room_nights: "Szobatípus / éjszaka (per fő / éj)",
  packages: "Csak csomagajánlatok",
  both: "Szobatípus + opcionális csomag",
}

/** Effective mode — explicit field or inferred from stored pricing shape. */
export function resolveAccommodationMode(pricing: TBookHotelPricing): TBookAccommodationMode {
  if (pricing.accommodationMode) return pricing.accommodationMode
  const packages = pricing.packages ?? []
  const rooms = pricing.roomTypes ?? []
  if (packages.length > 0 && rooms.length === 0) return "packages"
  if (packages.length > 0) return "both"
  return "room_nights"
}

export function hotelShowsRoomSelection(pricing: TBookHotelPricing): boolean {
  const mode = resolveAccommodationMode(pricing)
  return mode === "room_nights" || mode === "both"
}

export function hotelShowsPackageSelection(pricing: TBookHotelPricing): boolean {
  const mode = resolveAccommodationMode(pricing)
  return mode === "packages" || mode === "both"
}

export function hotelRequiresPackageSelection(pricing: TBookHotelPricing): boolean {
  return resolveAccommodationMode(pricing) === "packages"
}

/** Client-side / admin save guard mirroring Zod rules. */
export function validateHotelPricingConfig(pricing: TBookHotelPricing): string | null {
  const mode = resolveAccommodationMode(pricing)
  const hasLegacy = pricing.baseRateHuf != null || (pricing.options?.length ?? 0) > 0
  if ((mode === "room_nights" || mode === "both") && pricing.roomTypes.length === 0 && !hasLegacy) {
    return "Legalább egy szobatípus szükséges."
  }
  if (mode === "packages" && (pricing.packages ?? []).length === 0) {
    return "Legalább egy csomagajánlat szükséges."
  }
  return null
}

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

function assignOptionKeys(options: TBookOptionDef[], optionKeys: Set<string>, prefix: string) {
  return options.map((option, optionIndex) => {
    const optionKey = resolveKey(
      option.label,
      option.key,
      optionKeys,
      `${prefix}_${optionIndex + 1}`
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

  const packageKeys = new Set<string>()
  const packages = (pricing.packages ?? []).map((pkg, index) => ({
    ...pkg,
    key: resolveKey(pkg.label, pkg.key, packageKeys, `package_${index + 1}`),
  }))

  const optionKeys = new Set<string>()
  const extrasSection = pricing.extrasSection
    ? {
        ...pricing.extrasSection,
        options: assignOptionKeys(pricing.extrasSection.options, optionKeys, "field"),
      }
    : null

  return { ...pricing, roomTypes, packages, extrasSection, addonGroups: [] }
}

function withAccommodationMode(raw: TBookHotelPricing, normalized: TBookHotelPricing): TBookHotelPricing {
  return {
    ...normalized,
    accommodationMode: raw.accommodationMode ?? normalized.accommodationMode,
  }
}

function migrateAddonGroupsToExtras(
  addonGroups: NonNullable<TBookHotelPricing["addonGroups"]>
): TBookExtrasSection | null {
  if (addonGroups.length === 0) return null
  const first = addonGroups[0]
  const options = addonGroups.flatMap((group) => group.options)
  if (!first.label.trim() && options.length === 0) return null
  return {
    label: first.label || "Extrák és felárak",
    description: first.description ?? "",
    options,
  }
}

/** Normalizes legacy flat `baseRate + options[]` into room types + grouped add-ons. */
export function normalizeHotelPricing(raw: TBookHotelPricing): TBookHotelPricing {
  const base = {
    priceBasis: raw.priceBasis ?? "net",
    vatPercent: raw.vatPercent ?? 27,
    packages: raw.packages ?? [],
    accommodationMode: raw.accommodationMode,
  }

  if (raw.roomTypes?.length) {
    const extrasSection =
      raw.extrasSection ?? migrateAddonGroupsToExtras(raw.addonGroups ?? []) ?? null
    return withAccommodationMode(raw, {
      ...base,
      roomTypes: raw.roomTypes,
      extrasSection,
      addonGroups: [],
    })
  }

  if ((raw.packages?.length ?? 0) > 0 && resolveAccommodationMode(raw) === "packages") {
    const extrasSection =
      raw.extrasSection ?? migrateAddonGroupsToExtras(raw.addonGroups ?? []) ?? null
    return withAccommodationMode(raw, {
      ...base,
      roomTypes: [],
      extrasSection,
      addonGroups: [],
    })
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

  const extrasSection: TBookExtrasSection | null =
    otherOptions.length > 0
      ? {
          label: "Felárak & extrák",
          description: "",
          options: otherOptions,
        }
      : raw.extrasSection ?? migrateAddonGroupsToExtras(raw.addonGroups ?? []) ?? null

  return withAccommodationMode(raw, {
    ...base,
    roomTypes,
    extrasSection,
    addonGroups: [],
  })
}

export function flattenAddonOptions(pricing: TBookHotelPricing): TBookOptionDef[] {
  const normalized = normalizeHotelPricing(pricing)
  return [...(normalized.extrasSection?.options ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )
}

export function getExtrasSection(pricing: TBookHotelPricing): TBookExtrasSection | null {
  const normalized = normalizeHotelPricing(pricing)
  const section = normalized.extrasSection
  if (!section) return null
  if (!section.label.trim() && section.options.length === 0) return null
  return section
}

export function findRoomType(
  pricing: TBookHotelPricing,
  roomTypeKey: string
): TBookRoomType | null {
  const normalized = normalizeHotelPricing(pricing)
  return normalized.roomTypes.find((r) => r.key === roomTypeKey) ?? null
}

export function findPackageDeal(
  pricing: TBookHotelPricing,
  packageKey: string
): TBookPackageDeal | null {
  const normalized = normalizeHotelPricing(pricing)
  return normalized.packages?.find((p) => p.key === packageKey) ?? null
}

/** Packages matching the selected room type and night count (room_nights / both modes). */
export function matchingPackageDeals(
  pricing: TBookHotelPricing,
  nights: number,
  roomTypeKey: string
): TBookPackageDeal[] {
  const normalized = normalizeHotelPricing(pricing)
  return (normalized.packages ?? []).filter(
    (pkg) =>
      pkg.nights === nights &&
      (!pkg.roomTypeKey || pkg.roomTypeKey === roomTypeKey)
  )
}

/** Packages shown to guests — mode-aware. */
export function guestPackageDeals(
  pricing: TBookHotelPricing,
  nights?: number,
  roomTypeKey?: string
): TBookPackageDeal[] {
  const normalized = normalizeHotelPricing(pricing)
  const mode = resolveAccommodationMode(normalized)
  let deals = [...(normalized.packages ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  )

  if (mode === "packages") {
    if (nights != null && nights > 0) {
      deals = deals.filter((pkg) => pkg.nights === nights)
    }
    return deals
  }

  if (!roomTypeKey) return []
  return matchingPackageDeals(normalized, nights ?? 1, roomTypeKey)
}

/**
 * Package units required for a guest count.
 * Unset/null maxGuests defaults to 1 (one guest per package unit) so room
 * packages scale with headcount — e.g. 4 guests → 4× single.
 */
export function packageUnitsForGuests(
  packageDeal: Pick<TBookPackageDeal, "maxGuests">,
  guests: number
): number {
  const cap =
    packageDeal.maxGuests != null && packageDeal.maxGuests > 0
      ? packageDeal.maxGuests
      : 1
  return Math.max(1, Math.ceil(Math.max(1, guests) / cap))
}

export function packageDealCapacity(
  packageDeal: Pick<TBookPackageDeal, "maxGuests">
): number {
  return packageDeal.maxGuests != null && packageDeal.maxGuests > 0
    ? packageDeal.maxGuests
    : 1
}

export function formatPackageDealCapacityLabel(
  packageDeal: Pick<TBookPackageDeal, "maxGuests">,
  guests?: number
): string | null {
  const cap = packageDealCapacity(packageDeal)
  if (guests != null && guests > 0) {
    const units = packageUnitsForGuests(packageDeal, guests)
    if (units > 1) {
      return `${units} packages needed (${guests} guests, max ${cap}/package)`
    }
  }
  return `Max ${cap} guest${cap === 1 ? "" : "s"}/package`
}

export function parsePackageUnits(
  selections: Record<string, unknown>
): Record<string, number> | null {
  const raw = selections[PACKAGE_UNITS_SELECTION_KEY]
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const units: Record<string, number> = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const qty = Number(value)
    if (Number.isFinite(qty) && qty > 0) units[key] = Math.floor(qty)
  }
  return Object.keys(units).length > 0 ? units : null
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
  packageCount: number
  addonOptionCount: number
  /** room types × product(add-on branch counts) */
  estimatedBookingPaths: number
}

export function hotelComplexityStats(pricing: TBookHotelPricing): HotelComplexityStats {
  const normalized = normalizeHotelPricing(pricing)
  const mode = resolveAccommodationMode(normalized)
  const addons = flattenAddonOptions(normalized)
  const addonPaths = addons.reduce((acc, option) => acc * choicePaths(option), 1)
  const packageCount = normalized.packages?.length ?? 0
  const roomTypeCount = normalized.roomTypes.length
  const primaryPaths =
    mode === "packages"
      ? Math.max(1, packageCount)
      : mode === "both"
        ? Math.max(1, roomTypeCount) + packageCount
        : Math.max(1, roomTypeCount)
  return {
    roomTypeCount,
    packageCount,
    addonOptionCount: addons.length,
    estimatedBookingPaths: primaryPaths * addonPaths,
  }
}

export function eventHotelsComplexitySummary(
  hotels: Array<{ pricing: TBookHotelPricing }>
): {
  hotelCount: number
  totalRoomTypes: number
  totalPackages: number
  totalEstimatedPaths: number
} {
  let totalRoomTypes = 0
  let totalPackages = 0
  let totalEstimatedPaths = 0
  for (const hotel of hotels) {
    const stats = hotelComplexityStats(hotel.pricing)
    totalRoomTypes += stats.roomTypeCount
    totalPackages += stats.packageCount
    totalEstimatedPaths += stats.estimatedBookingPaths
  }
  return {
    hotelCount: hotels.length,
    totalRoomTypes,
    totalPackages,
    totalEstimatedPaths,
  }
}

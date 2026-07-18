import type { Types } from "mongoose"
import TBookBooking from "../models/TBookBooking"
import {
  PACKAGE_DEAL_SELECTION_KEY,
  packageUnitsForGuests,
  parsePackageUnits,
} from "./hotel-pricing"
import type { TBookPackageDeal, TBookSelections } from "./pricing-types"

const ACTIVE_STATUSES = ["pending", "checkout_started", "paid", "confirmed"] as const

/** Units requested for each package key from a booking’s selections. */
export function packageUnitsFromSelections(
  selections: TBookSelections | Record<string, unknown>,
  packages: TBookPackageDeal[],
  accommodationGuests: number
): Record<string, number> {
  const units = parsePackageUnits(selections as Record<string, unknown>)
  if (units) return units

  const dealKey = String(
    (selections as Record<string, unknown>)[PACKAGE_DEAL_SELECTION_KEY] ?? ""
  ).trim()
  if (!dealKey) return {}

  const deal = packages.find((pkg) => pkg.key === dealKey)
  if (!deal) return { [dealKey]: 1 }

  return { [dealKey]: packageUnitsForGuests(deal, accommodationGuests) }
}

/**
 * Sold units for a hotel, using package `maxGuests` when only `package_deal` is set.
 * Inventory is hotel-wide (allotment from the property), not per event.
 */
export async function countSoldPackageUnitsForHotel(
  hotelId: Types.ObjectId | string,
  packages: TBookPackageDeal[]
): Promise<Record<string, number>> {
  const bookings = await TBookBooking.find({
    hotelId,
    status: { $in: [...ACTIVE_STATUSES] },
  })
    .select("selections guests quote.accommodationGuests")
    .lean()

  const sold: Record<string, number> = {}
  for (const booking of bookings) {
    const quoteGuests = (booking.quote as { accommodationGuests?: number } | undefined)
      ?.accommodationGuests
    const guests =
      typeof quoteGuests === "number" && quoteGuests > 0
        ? quoteGuests
        : typeof booking.guests === "number"
          ? booking.guests
          : 1
    const units = packageUnitsFromSelections(
      (booking.selections ?? {}) as TBookSelections,
      packages,
      guests
    )
    for (const [key, qty] of Object.entries(units)) {
      sold[key] = (sold[key] ?? 0) + qty
    }
  }
  return sold
}

/** Throws if requested units exceed remaining allotment. */
export async function assertPackageInventoryAvailable(opts: {
  hotelId: Types.ObjectId | string
  packages: TBookPackageDeal[]
  selections: TBookSelections | Record<string, unknown>
  accommodationGuests: number
}): Promise<void> {
  const requested = packageUnitsFromSelections(
    opts.selections,
    opts.packages,
    opts.accommodationGuests
  )
  if (Object.keys(requested).length === 0) return

  const limited = opts.packages.filter(
    (pkg) => pkg.inventoryUnits != null && pkg.inventoryUnits >= 0
  )
  if (limited.length === 0) return

  const sold = await countSoldPackageUnitsForHotel(opts.hotelId, opts.packages)
  for (const [key, qty] of Object.entries(requested)) {
    const pkg = opts.packages.find((p) => p.key === key)
    if (!pkg || pkg.inventoryUnits == null || pkg.inventoryUnits < 0) continue
    const remaining = Math.max(0, pkg.inventoryUnits - (sold[key] ?? 0))
    if (qty > remaining) {
      throw new Error(
        remaining === 0
          ? `No rooms left for “${pkg.label}”.`
          : `Only ${remaining} room(s) left for “${pkg.label}” (you need ${qty}).`
      )
    }
  }
}

/** Attach remainingUnits onto packages for public hotel payloads. */
export function withPackageRemainingUnits(
  packages: TBookPackageDeal[],
  soldByKey: Record<string, number>
): Array<TBookPackageDeal & { remainingUnits?: number | null }> {
  return packages.map((pkg) => {
    if (pkg.inventoryUnits == null || pkg.inventoryUnits < 0) {
      return { ...pkg, remainingUnits: null }
    }
    return {
      ...pkg,
      remainingUnits: Math.max(0, pkg.inventoryUnits - (soldByKey[pkg.key] ?? 0)),
    }
  })
}

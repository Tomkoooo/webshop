"use client"

import type { TBookHotelPricing } from "../lib/pricing-types"
import {
  eventHotelsComplexitySummary,
  hotelComplexityStats,
} from "../lib/hotel-pricing"

export function HotelComplexitySummary({
  pricing,
  hotels,
}: {
  pricing?: TBookHotelPricing
  hotels?: Array<{ name: string; pricing: TBookHotelPricing }>
}) {
  if (hotels && hotels.length > 0) {
    const summary = eventHotelsComplexitySummary(hotels)
    return (
      <div className="rounded-xl border border-violet-500/25 bg-violet-950/20 px-4 py-3 text-sm space-y-1">
        <p className="font-bold text-violet-200">Esemény összesítés</p>
        <p className="text-violet-100/80 text-xs leading-relaxed">
          <strong>{summary.hotelCount}</strong> szállás ·{" "}
          <strong>{summary.totalRoomTypes}</strong> szobatípus összesen ·{" "}
          <strong>{summary.totalAddonGroups}</strong> felár-csoport · kb.{" "}
          <strong>{summary.totalEstimatedPaths.toLocaleString("hu-HU")}</strong> lehetséges
          szállás-konfiguráció (szobatípus × felárak).
        </p>
        <ul className="text-[11px] text-violet-200/70 space-y-0.5 pt-1">
          {hotels.map((hotel) => {
            const stats = hotelComplexityStats(hotel.pricing)
            return (
              <li key={hotel.name}>
                {hotel.name}: {stats.roomTypeCount} szoba × {stats.addonOptionCount} felár mező ≈{" "}
                {stats.estimatedBookingPaths.toLocaleString("hu-HU")} út
              </li>
            )
          })}
        </ul>
      </div>
    )
  }

  if (!pricing) return null
  const stats = hotelComplexityStats(pricing)

  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-950/20 px-4 py-3 text-sm">
      <p className="font-bold text-violet-200 mb-1">Konfiguráció áttekintés</p>
      <p className="text-violet-100/80 text-xs leading-relaxed">
        <strong>{stats.roomTypeCount}</strong> szobatípus ·{" "}
        <strong>{stats.addonGroupCount}</strong> felár-csoport (
        <strong>{stats.addonOptionCount}</strong> mező) → kb.{" "}
        <strong>{stats.estimatedBookingPaths.toLocaleString("hu-HU")}</strong> lehetséges
        vendég-útvonal ebben a szállásban.
      </p>
      <p className="text-[11px] text-violet-200/60 mt-2">
        Példa: 3 szállás × 2 szobatípus × 5 felár ≈ sok kombináció — ezért csoportosítjuk a
        mezőket, és a szobatípus külön lépés.
      </p>
    </div>
  )
}

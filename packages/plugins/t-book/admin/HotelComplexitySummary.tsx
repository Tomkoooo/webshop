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
      <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm space-y-1 shadow-sm">
        <p className="font-semibold text-foreground">Esemény összesítés</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong className="text-foreground">{summary.hotelCount}</strong> szállás ·{" "}
          <strong className="text-foreground">{summary.totalRoomTypes}</strong> szobatípus összesen ·{" "}
          <strong className="text-foreground">{summary.totalAddonGroups}</strong> foglalási szakasz · kb.{" "}
          <strong className="text-foreground">
            {summary.totalEstimatedPaths.toLocaleString("hu-HU")}
          </strong>{" "}
          lehetséges szállás-konfiguráció (szobatípus × felárak).
        </p>
        <ul className="text-xs text-muted-foreground space-y-0.5 pt-1">
          {hotels.map((hotel) => {
            const stats = hotelComplexityStats(hotel.pricing)
            return (
              <li key={hotel.name}>
                {hotel.name}: {stats.roomTypeCount} szoba × {stats.addonOptionCount} foglalási mező ≈{" "}
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
    <div className="rounded-xl bg-muted/40 px-4 py-3 text-sm shadow-sm">
      <p className="font-semibold text-foreground mb-1">Konfiguráció áttekintés</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">{stats.roomTypeCount}</strong> szobatípus ·{" "}
        <strong className="text-foreground">{stats.addonGroupCount}</strong> foglalási szakasz (
        <strong className="text-foreground">{stats.addonOptionCount}</strong> mező) → kb.{" "}
        <strong className="text-foreground">
          {stats.estimatedBookingPaths.toLocaleString("hu-HU")}
        </strong>{" "}
        lehetséges vendég-útvonal ebben a szállásban.
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        A szakaszok csak a vendég felületén csoportosítják a mezőket (pl. „Étkezés és kényelem”). A
        szobatípus külön lépés marad.
      </p>
    </div>
  )
}

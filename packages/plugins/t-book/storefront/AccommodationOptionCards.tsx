"use client"

import { BedDouble, MapPin, Ticket } from "lucide-react"
import type { TBookPublicHotel } from "./tbook-public-api"

type Props = {
  hotels: TBookPublicHotel[]
  selectedHotelId: string | null
  ticketOnlySelected: boolean
  onSelectTicketOnly: () => void
  onSelectHotel: (hotelId: string) => void
}

function cardClass(selected: boolean) {
  return `rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
    selected
      ? "border-primary bg-primary/10 shadow-sm"
      : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
  }`
}

function hotelHint(hotel: TBookPublicHotel): string {
  const parts: string[] = []
  if (hotel.distanceFromVenueKm != null) {
    parts.push(`${hotel.distanceFromVenueKm} km from venue`)
  }
  const mode = hotel.pricing?.accommodationMode
  if (mode === "packages") parts.push("Package stays")
  else if (mode === "both") parts.push("Rooms & packages")
  else parts.push("Per-night rooms")
  return parts.join(" · ")
}

export function AccommodationOptionCards({
  hotels,
  selectedHotelId,
  ticketOnlySelected,
  onSelectTicketOnly,
  onSelectHotel,
}: Props) {
  if (hotels.length === 0) return null

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">Accommodation</legend>
      <p className="text-xs text-muted-foreground">
        Choose ticket only, or add a hotel stay. Ticket only is selected by default.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          className={cardClass(ticketOnlySelected)}
          aria-pressed={ticketOnlySelected}
          onClick={onSelectTicketOnly}
        >
          <span className="flex items-start gap-3">
            <span
              className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${
                ticketOnlySelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              }`}
            >
              <Ticket className="size-4" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Ticket only</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Entry fees only — no hotel booking.
              </span>
            </span>
          </span>
        </button>

        {hotels.map((hotel) => {
          const selected = !ticketOnlySelected && selectedHotelId === hotel.id
          const description = hotel.description?.trim()
          return (
            <button
              key={hotel.id}
              type="button"
              className={cardClass(selected)}
              aria-pressed={selected}
              onClick={() => onSelectHotel(hotel.id)}
            >
              <span className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg ${
                    selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <BedDouble className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{hotel.name}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{hotelHint(hotel)}</span>
                  {hotel.address?.trim() ? (
                    <span className="mt-1.5 flex items-start gap-1 text-xs text-muted-foreground">
                      <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
                      <span className="line-clamp-2">{hotel.address}</span>
                    </span>
                  ) : null}
                  {description ? (
                    <span className="mt-1.5 block text-xs text-muted-foreground line-clamp-2">
                      {description}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

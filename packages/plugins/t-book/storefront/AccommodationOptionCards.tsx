"use client"

import { useState } from "react"
import { BedDouble, MapPin, Ticket } from "lucide-react"
import { mediaImageSrc, PLACEHOLDER_IMAGE } from "@wse/core/lib/images"
import { plainTextFromHtml } from "@wse/core/lib/plain-text-from-html"
import type { TBookPublicHotel } from "./tbook-public-api"

type Props = {
  hotels: TBookPublicHotel[]
  selectedHotelId: string | null
  ticketOnlySelected: boolean
  onSelectTicketOnly: () => void
  onSelectHotel: (hotelId: string) => void
  /** When true, only hotel cards are shown (entry-only already chosen upstream). */
  hideEntryOnlyOption?: boolean
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

function HotelCoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? PLACEHOLDER_IMAGE : mediaImageSrc(src)

  return (
    <span className="mb-3 block overflow-hidden rounded-lg bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolved}
        alt={alt}
        className="aspect-[16/9] w-full object-cover"
        onError={() => setFailed(true)}
      />
    </span>
  )
}

function HotelThumb({ src }: { src: string }) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? PLACEHOLDER_IMAGE : mediaImageSrc(src)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt=""
      className="aspect-[4/3] w-full rounded-md bg-muted object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export function AccommodationOptionCards({
  hotels,
  selectedHotelId,
  ticketOnlySelected,
  onSelectTicketOnly,
  onSelectHotel,
  hideEntryOnlyOption = false,
}: Props) {
  if (hotels.length === 0) return null

  return (
    <fieldset className="space-y-3">
      <legend className="text-sm font-medium">
        {hideEntryOnlyOption ? "Choose a hotel" : "Accommodation"}
      </legend>
      {!hideEntryOnlyOption ? (
        <p className="text-xs text-muted-foreground">
          Choose entry only, or add a hotel stay. Entry only is selected by default.
        </p>
      ) : null}
      <div className={`grid gap-3 ${hideEntryOnlyOption ? "" : "sm:grid-cols-2"}`}>
        {!hideEntryOnlyOption ? (
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
                <span className="block text-sm font-semibold">Entry only</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Entry fees only — no hotel booking.
                </span>
              </span>
            </span>
          </button>
        ) : null}

        {hotels.map((hotel) => {
          const selected = !ticketOnlySelected && selectedHotelId === hotel.id
          const description = hotel.description?.trim()
          const gallery = (hotel.gallery ?? []).filter(Boolean).slice(0, 4)
          const cover = gallery[0] ?? null
          return (
            <button
              key={hotel.id}
              type="button"
              className={cardClass(selected)}
              aria-pressed={selected}
              onClick={() => onSelectHotel(hotel.id)}
            >
              {cover ? (
                <HotelCoverImage src={cover} alt="" />
              ) : (
                <span className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <BedDouble className="size-8" aria-hidden />
                </span>
              )}
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
                    <span className="mt-1.5 block line-clamp-3 text-xs text-muted-foreground">
                      {plainTextFromHtml(description)}
                    </span>
                  ) : null}
                </span>
              </span>
              {gallery.length > 1 ? (
                <span className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden>
                  {gallery.slice(1).map((src) => (
                    <HotelThumb key={src} src={src} />
                  ))}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

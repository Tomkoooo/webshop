"use client"

import { useEffect, useState } from "react"
import { BedDouble, ChevronLeft, ChevronRight, Expand, MapPin, Ticket } from "lucide-react"
import { mediaImageSrc, PLACEHOLDER_IMAGE } from "@wse/core/lib/images"
import { plainTextFromHtml } from "@wse/core/lib/plain-text-from-html"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@wse/core/components/ui/dialog"
import { cn } from "@wse/core/lib/utils"
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

const ACCESSIBILITY_BADGE_RE =
  /handicap|akadály|accessible|wheelchair|barrier|disabled|mozgáskorlátoz|akadaly/i

function hotelAddonBadges(hotel: TBookPublicHotel): Array<{ label: string; highlight: boolean }> {
  const options = hotel.pricing?.extrasSection?.options ?? []
  const badges: Array<{ label: string; highlight: boolean }> = []
  const seen = new Set<string>()

  for (const option of options) {
    const label = option.label?.trim()
    if (!label) continue
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    badges.push({
      label,
      highlight: ACCESSIBILITY_BADGE_RE.test(label) || ACCESSIBILITY_BADGE_RE.test(option.key ?? ""),
    })
  }

  return badges
}

function HotelImage({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className?: string
}) {
  const [failed, setFailed] = useState(false)
  const resolved = failed ? PLACEHOLDER_IMAGE : mediaImageSrc(src)

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={cn("h-full w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  )
}

function ImageCarousel({
  images,
  hotelName,
  index,
  onIndexChange,
  onExpand,
  compact,
}: {
  images: string[]
  hotelName: string
  index: number
  onIndexChange: (next: number) => void
  onExpand?: () => void
  compact?: boolean
}) {
  const count = images.length
  const current = images[Math.min(index, Math.max(0, count - 1))] ?? null

  const go = (delta: number, e?: { stopPropagation: () => void; preventDefault: () => void }) => {
    e?.stopPropagation()
    e?.preventDefault()
    if (count <= 1) return
    onIndexChange((index + delta + count) % count)
  }

  if (!current) {
    return (
      <span
        className={cn(
          "flex w-full items-center justify-center bg-muted text-muted-foreground",
          compact ? "aspect-[16/10]" : "aspect-[16/10] min-h-[240px]"
        )}
      >
        <BedDouble className={compact ? "size-7" : "size-10"} aria-hidden />
      </span>
    )
  }

  return (
    <span className={cn("relative block overflow-hidden bg-muted", compact ? "aspect-[16/10]" : "aspect-[16/10]")}>
      <HotelImage src={current} alt={`${hotelName} photo ${index + 1} of ${count}`} />
      {count > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-1 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Previous photo"
            onClick={(e) => go(-1, e)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="absolute right-1 top-1/2 z-10 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="Next photo"
            onClick={(e) => go(1, e)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <span className="absolute bottom-1.5 left-1/2 z-10 flex -translate-x-1/2 gap-1" aria-hidden>
            {images.map((_, i) => (
              <span
                key={i}
                className={cn(
                  "size-1.5 rounded-full",
                  i === index ? "bg-primary" : "bg-background/70"
                )}
              />
            ))}
          </span>
        </>
      ) : null}
      {onExpand ? (
        <button
          type="button"
          className="absolute right-1.5 top-1.5 z-10 flex size-7 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur-sm hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label={`View larger photos of ${hotelName}`}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onExpand()
          }}
        >
          <Expand className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </span>
  )
}

function HotelGalleryModal({
  open,
  onOpenChange,
  hotelName,
  images,
  startIndex,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  hotelName: string
  images: string[]
  startIndex: number
}) {
  const [index, setIndex] = useState(startIndex)

  useEffect(() => {
    if (open) setIndex(startIndex)
  }, [open, startIndex])

  useEffect(() => {
    if (!open || images.length <= 1) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setIndex((i) => (i - 1 + images.length) % images.length)
      if (e.key === "ArrowRight") setIndex((i) => (i + 1) % images.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, images.length])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl gap-3 overflow-hidden border-border bg-background p-4 text-foreground sm:p-5">
        <div className="pr-8">
          <DialogTitle className="truncate text-base font-semibold normal-case not-italic tracking-normal text-foreground">
            {hotelName}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {images.length > 0
              ? `Photo ${Math.min(index, images.length - 1) + 1} of ${images.length}`
              : "No photos"}
          </DialogDescription>
        </div>
        <div className="overflow-hidden rounded-lg border border-border">
          <ImageCarousel
            images={images}
            hotelName={hotelName}
            index={index}
            onIndexChange={setIndex}
            compact={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

function HotelCard({
  hotel,
  selected,
  onSelect,
}: {
  hotel: TBookPublicHotel
  selected: boolean
  onSelect: () => void
}) {
  const gallery = (hotel.gallery ?? []).filter(Boolean)
  const [imageIndex, setImageIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const description = hotel.description?.trim()
  const badges = hotelAddonBadges(hotel)

  return (
    <>
      <article
        className={cn(
          "flex w-[min(100%,240px)] shrink-0 flex-col overflow-hidden rounded-xl border text-left transition-colors sm:w-[220px]",
          selected
            ? "border-primary bg-primary/10 shadow-sm"
            : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
        )}
      >
        <ImageCarousel
          images={gallery}
          hotelName={hotel.name}
          index={imageIndex}
          onIndexChange={setImageIndex}
          onExpand={gallery.length > 0 ? () => setLightboxOpen(true) : undefined}
          compact
        />
        <button
          type="button"
          className="flex flex-1 flex-col gap-1.5 p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
          aria-pressed={selected}
          onClick={onSelect}
        >
          <span className="line-clamp-2 text-sm font-semibold leading-snug">{hotel.name}</span>
          <span className="line-clamp-1 text-xs text-muted-foreground">{hotelHint(hotel)}</span>
          {badges.length > 0 ? (
            <span className="flex flex-wrap gap-1 pt-0.5">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={cn(
                    "inline-flex max-w-full truncate rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    badge.highlight
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {badge.label}
                </span>
              ))}
            </span>
          ) : null}
          {hotel.address?.trim() ? (
            <span className="flex items-start gap-1 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
              <span className="line-clamp-2">{hotel.address}</span>
            </span>
          ) : null}
          {description ? (
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {plainTextFromHtml(description)}
            </span>
          ) : null}
        </button>
      </article>
      <HotelGalleryModal
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        hotelName={hotel.name}
        images={gallery}
        startIndex={imageIndex}
      />
    </>
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

      {!hideEntryOnlyOption ? (
        <button
          type="button"
          className={cn(
            "w-full rounded-xl border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:max-w-sm",
            ticketOnlySelected
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-border bg-surface hover:border-primary/40 hover:bg-muted/30"
          )}
          aria-pressed={ticketOnlySelected}
          onClick={onSelectTicketOnly}
        >
          <span className="flex items-start gap-3">
            <span
              className={cn(
                "mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                ticketOnlySelected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
              )}
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

      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:thin]">
        {hotels.map((hotel) => (
          <HotelCard
            key={hotel.id}
            hotel={hotel}
            selected={!ticketOnlySelected && selectedHotelId === hotel.id}
            onSelect={() => onSelectHotel(hotel.id)}
          />
        ))}
      </div>
    </fieldset>
  )
}

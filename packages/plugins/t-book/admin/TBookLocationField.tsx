"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@wse/core/components/ui/button"
import {
  emptyTBookLocation,
  googleMapsEmbedFromCoords,
  normalizeMapEmbedUrl,
  type TBookLocation,
} from "../lib/location"
import { tBookAdminApi } from "./t-book-api"
import { TBookField, TBookInput } from "./t-book-admin-ui"

export function TBookLocationField({
  value,
  onChange,
}: {
  value?: TBookLocation
  onChange: (location: TBookLocation) => void
}) {
  const location = value ?? emptyTBookLocation()
  const [geocoding, setGeocoding] = useState(false)

  const patch = (partial: Partial<TBookLocation>) => onChange({ ...location, ...partial })

  const geocode = async () => {
    if (!location.address.trim()) {
      toast.error("Add meg a címet a geokódoláshoz.")
      return
    }
    setGeocoding(true)
    try {
      const result = await tBookAdminApi<{ lat: number; lng: number; mapEmbedUrl: string }>(
        "geocode",
        {
          method: "POST",
          body: JSON.stringify({ address: location.address }),
        }
      )
      patch({
        lat: result.lat,
        lng: result.lng,
        mapEmbedUrl: result.mapEmbedUrl,
      })
      toast.success("Koordináták és térkép beállítva.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Geokódolás sikertelen")
    } finally {
      setGeocoding(false)
    }
  }

  const useCoordsEmbed = () => {
    if (location.lat == null || location.lng == null) {
      toast.error("Előbb állíts be koordinátákat.")
      return
    }
    patch({ mapEmbedUrl: googleMapsEmbedFromCoords(location.lat, location.lng) })
  }

  return (
    <div className="space-y-4">
      <TBookField label="Cím">
        <TBookInput
          value={location.address}
          onChange={(e) => patch({ address: e.target.value })}
          placeholder="1051 Budapest, Fő tér 1."
        />
      </TBookField>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-9 border-white/10 text-white text-xs font-bold"
          disabled={geocoding}
          onClick={() => void geocode()}
        >
          {geocoding ? "Geokódolás…" : "Geokódolás (OpenStreetMap)"}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-9 border-white/10 text-white text-xs font-bold"
          onClick={useCoordsEmbed}
        >
          Google Maps embed koordinátákból
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TBookField label="Szélesség (lat)">
          <TBookInput
            type="number"
            step="any"
            value={location.lat ?? ""}
            onChange={(e) =>
              patch({ lat: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </TBookField>
        <TBookField label="Hosszúság (lng)">
          <TBookInput
            type="number"
            step="any"
            value={location.lng ?? ""}
            onChange={(e) =>
              patch({ lng: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </TBookField>
      </div>
      <TBookField label="Térkép embed (iframe src vagy teljes iframe kód)">
        <textarea
          className="w-full min-h-20 bg-black border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary/50"
          value={location.mapEmbedUrl}
          onChange={(e) => patch({ mapEmbedUrl: normalizeMapEmbedUrl(e.target.value) })}
          placeholder='https://www.google.com/maps/embed?pb=… vagy <iframe src="…">'
        />
      </TBookField>
      {location.mapEmbedUrl ? (
        <div className="rounded-xl overflow-hidden border border-white/10 aspect-video bg-black">
          <iframe
            title="Térkép előnézet"
            src={normalizeMapEmbedUrl(location.mapEmbedUrl)}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
    </div>
  )
}

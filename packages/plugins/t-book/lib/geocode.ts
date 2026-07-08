import { googleMapsEmbedFromCoords } from "./location"

type NominatimResult = {
  lat: string
  lon: string
  display_name: string
}

export async function geocodeAddress(address: string): Promise<{
  lat: number
  lng: number
  mapEmbedUrl: string
  displayName: string
}> {
  const query = address.trim()
  if (!query) throw new Error("A cím megadása kötelező.")

  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "json")
  url.searchParams.set("limit", "1")
  url.searchParams.set("q", query)

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "webshop-engine-tbook/1.0",
      Accept: "application/json",
    },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error("Geokódolási szolgáltatás nem elérhető.")

  const results = (await res.json()) as NominatimResult[]
  const hit = results[0]
  if (!hit) throw new Error("A címhez nem található koordináta.")

  const lat = Number(hit.lat)
  const lng = Number(hit.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Érvénytelen geokódolási válasz.")
  }

  return {
    lat,
    lng,
    mapEmbedUrl: googleMapsEmbedFromCoords(lat, lng),
    displayName: hit.display_name,
  }
}

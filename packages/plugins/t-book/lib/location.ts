export type TBookLocation = {
  address: string
  lat: number | null
  lng: number | null
  /** Google Maps embed `src` or full `<iframe …>` snippet for API consumers. */
  mapEmbedUrl: string
}

export const emptyTBookLocation = (): TBookLocation => ({
  address: "",
  lat: null,
  lng: null,
  mapEmbedUrl: "",
})

/** Accepts a bare embed URL or a pasted iframe tag — returns the `src` value. */
export function normalizeMapEmbedUrl(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) return ""
  const iframeMatch = trimmed.match(/src=["']([^"']+)["']/i)
  if (iframeMatch?.[1]) return iframeMatch[1].trim()
  return trimmed
}

export function googleMapsEmbedFromCoords(lat: number, lng: number): string {
  return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`
}

/**
 * Thin storefronts (e.g. WDF) proxy tBook JSON but keep their own /api/media.
 * Uploaded images live on the tBook host as bare filenames — rewrite them to
 * absolute URLs on the upstream origin so <img> / CSS url() resolve correctly.
 */

export function mediaOriginFromApiBase(apiBase: string | null | undefined): string | null {
  const trimmed = apiBase?.trim().replace(/\/$/, "")
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) return null
  try {
    const url = new URL(trimmed)
    return url.origin
  } catch {
    return null
  }
}

/** Turn a stored media ref into an absolute URL on `mediaOrigin`, or leave as-is. */
export function absolutizeTBookMediaUrl(
  value: string | null | undefined,
  mediaOrigin: string | null | undefined
): string {
  const raw = typeof value === "string" ? value.trim() : ""
  if (!raw) return ""
  if (
    raw.startsWith("data:") ||
    raw.startsWith("http://") ||
    raw.startsWith("https://")
  ) {
    return raw
  }
  if (!mediaOrigin) {
    if (raw.startsWith("/")) return raw
    return `/api/media/${raw}`
  }
  const origin = mediaOrigin.replace(/\/$/, "")
  if (raw.startsWith("/api/media/")) return `${origin}${raw}`
  if (raw.startsWith("/")) return `${origin}${raw}`
  return `${origin}/api/media/${raw}`
}

export function absolutizeTBookMediaList(
  values: string[] | null | undefined,
  mediaOrigin: string | null | undefined
): string[] {
  if (!values?.length) return []
  return values
    .map((v) => absolutizeTBookMediaUrl(v, mediaOrigin))
    .filter(Boolean)
}

type JsonRecord = Record<string, unknown>

function rewriteHotelMedia(hotel: JsonRecord, mediaOrigin: string): JsonRecord {
  const gallery = Array.isArray(hotel.gallery)
    ? absolutizeTBookMediaList(hotel.gallery as string[], mediaOrigin)
    : hotel.gallery
  return { ...hotel, gallery }
}

function rewriteEventMedia(event: JsonRecord, mediaOrigin: string): JsonRecord {
  return {
    ...event,
    heroImage: absolutizeTBookMediaUrl(
      typeof event.heroImage === "string" ? event.heroImage : "",
      mediaOrigin
    ),
  }
}

/** Rewrite hero/gallery fields on public events/hotels JSON payloads. */
export function rewriteTBookPublicMediaPayload(
  data: unknown,
  mediaOrigin: string | null | undefined
): unknown {
  if (!mediaOrigin || !data || typeof data !== "object") return data
  const payload = data as JsonRecord

  if (Array.isArray(payload.events)) {
    payload.events = payload.events.map((row) =>
      row && typeof row === "object"
        ? rewriteEventMedia(row as JsonRecord, mediaOrigin)
        : row
    )
  }

  if (payload.event && typeof payload.event === "object") {
    payload.event = rewriteEventMedia(payload.event as JsonRecord, mediaOrigin)
  }

  if (Array.isArray(payload.hotels)) {
    payload.hotels = payload.hotels.map((row) =>
      row && typeof row === "object"
        ? rewriteHotelMedia(row as JsonRecord, mediaOrigin)
        : row
    )
  }

  return payload
}

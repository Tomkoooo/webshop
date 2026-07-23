export type VideoEmbedProvider = "youtube" | "tiktok" | "unknown"

export type ParsedVideoEmbed = {
  provider: VideoEmbedProvider
  embedUrl: string | null
  sourceUrl: string
}

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  return `https://${trimmed}`
}

function youtubeIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase()
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0]
    return id || null
  }
  if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
    if (url.pathname === "/watch") {
      return url.searchParams.get("v")
    }
    const parts = url.pathname.split("/").filter(Boolean)
    if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") {
      return parts[1] || null
    }
  }
  return null
}

function tiktokIdFromUrl(url: URL): string | null {
  const host = url.hostname.replace(/^www\./, "").toLowerCase()
  if (host !== "tiktok.com" && host !== "vm.tiktok.com" && !host.endsWith(".tiktok.com")) {
    return null
  }
  const parts = url.pathname.split("/").filter(Boolean)
  const videoIdx = parts.indexOf("video")
  if (videoIdx !== -1 && parts[videoIdx + 1]) {
    return parts[videoIdx + 1]!.split(/[?#]/)[0] || null
  }
  const embedIdx = parts.indexOf("embed")
  if (embedIdx !== -1) {
    const maybeV2 = parts[embedIdx + 1]
    if (maybeV2 === "v2" && parts[embedIdx + 2]) return parts[embedIdx + 2]!
    if (maybeV2 && maybeV2 !== "v2") return maybeV2
  }
  return null
}

/** Parse a YouTube / TikTok watch or share URL into a safe iframe embed URL. */
export function parseVideoEmbedUrl(raw: string): ParsedVideoEmbed {
  const sourceUrl = normalizeUrl(raw)
  if (!sourceUrl) {
    return { provider: "unknown", embedUrl: null, sourceUrl: "" }
  }

  let url: URL
  try {
    url = new URL(sourceUrl)
  } catch {
    return { provider: "unknown", embedUrl: null, sourceUrl }
  }

  const youtubeId = youtubeIdFromUrl(url)
  if (youtubeId && /^[\w-]{6,}$/.test(youtubeId)) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      sourceUrl,
    }
  }

  const tiktokId = tiktokIdFromUrl(url)
  if (tiktokId && /^\d+$/.test(tiktokId)) {
    return {
      provider: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokId}`,
      sourceUrl,
    }
  }

  return { provider: "unknown", embedUrl: null, sourceUrl }
}

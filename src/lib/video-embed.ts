export type VideoEmbedProvider = "youtube" | "tiktok" | "unknown"

export type ParsedVideoEmbed = {
  provider: VideoEmbedProvider
  embedUrl: string | null
  /** Canonical watch/share URL suitable for CMS storage. */
  sourceUrl: string
}

export type VideoEmbedItem = {
  url: string
  caption?: string
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

function parseFromUrlString(raw: string): ParsedVideoEmbed {
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
      sourceUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
    }
  }

  const tiktokId = tiktokIdFromUrl(url)
  if (tiktokId && /^\d+$/.test(tiktokId)) {
    const cleanPath = sourceUrl.split(/[?#]/)[0] || sourceUrl
    const keepOriginal = /tiktok\.com\/@[^/]+\/video\//i.test(cleanPath)
    return {
      provider: "tiktok",
      embedUrl: `https://www.tiktok.com/embed/v2/${tiktokId}`,
      sourceUrl: keepOriginal ? cleanPath : `https://www.tiktok.com/video/${tiktokId}`,
    }
  }

  return { provider: "unknown", embedUrl: null, sourceUrl }
}

function tiktokFromVideoId(videoId: string): ParsedVideoEmbed {
  return {
    provider: "tiktok",
    embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
    sourceUrl: `https://www.tiktok.com/video/${videoId}`,
  }
}

/**
 * Pull candidate URLs / TikTok video IDs from free text or TikTok/YouTube embed HTML.
 * Supports unquoted attributes like `cite=https://…` from TikTok's copy-embed UI.
 */
export function extractVideoEmbedCandidates(raw: string): string[] {
  const text = raw.trim()
  if (!text) return []

  const found: string[] = []
  const push = (value: string) => {
    const cleaned = value.trim().replace(/[),.;]+$/g, "")
    if (cleaned && !found.includes(cleaned)) found.push(cleaned)
  }

  // Prefer full cite/href URLs (often include @handle) before bare data-video-id.
  for (const match of text.matchAll(
    /(?:cite|href|src)=(?:"([^"]+)"|'([^']+)'|([^\s>]+))/gi
  )) {
    const value = match[1] || match[2] || match[3]
    if (value) push(value)
  }

  for (const match of text.matchAll(
    /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com)[^\s"'<>]*/gi
  )) {
    push(match[0]!)
  }

  for (const match of text.matchAll(/data-video-id=(?:"([^"]+)"|'([^']+)'|([0-9]+))/gi)) {
    const id = match[1] || match[2] || match[3]
    if (id && /^\d+$/.test(id)) push(`https://www.tiktok.com/video/${id}`)
  }

  // Plain multiline URL list (no HTML)
  if (!text.includes("<") && found.length === 0) {
    for (const line of text.split(/\r?\n+/)) {
      const lineTrim = line.trim()
      if (lineTrim) push(lineTrim)
    }
  }

  return found
}

/** Parse a YouTube / TikTok URL, share link, or TikTok embed HTML snippet into an iframe embed URL. */
export function parseVideoEmbedUrl(raw: string): ParsedVideoEmbed {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { provider: "unknown", embedUrl: null, sourceUrl: "" }
  }

  const direct = parseFromUrlString(trimmed)
  if (direct.embedUrl) return direct

  const candidates = extractVideoEmbedCandidates(trimmed)
  for (const candidate of candidates) {
    const parsed = parseFromUrlString(candidate)
    if (parsed.embedUrl) return parsed
  }

  const idOnly = trimmed.match(/^\d{10,}$/)
  if (idOnly) return tiktokFromVideoId(idOnly[0]!)

  return { provider: "unknown", embedUrl: null, sourceUrl: trimmed }
}

/** Parse one or many pasted URLs / TikTok embed blocks into CMS video items (deduped). */
export function parseVideoEmbedBulk(raw: string): VideoEmbedItem[] {
  const candidates = extractVideoEmbedCandidates(raw)
  if (candidates.length === 0) {
    const single = parseVideoEmbedUrl(raw)
    return single.embedUrl ? [{ url: single.sourceUrl }] : []
  }

  const items: VideoEmbedItem[] = []
  const seen = new Set<string>()
  for (const candidate of candidates) {
    const parsed = parseVideoEmbedUrl(candidate)
    if (!parsed.embedUrl) continue
    if (seen.has(parsed.embedUrl)) continue
    seen.add(parsed.embedUrl)
    items.push({ url: parsed.sourceUrl })
  }
  return items
}

/** Merge bulk-parsed videos into an existing list (append, skip duplicates by embed URL). */
export function mergeVideoEmbedItems(
  existing: VideoEmbedItem[],
  incoming: VideoEmbedItem[]
): VideoEmbedItem[] {
  const seen = new Set(
    existing
      .map((item) => parseVideoEmbedUrl(item.url).embedUrl)
      .filter((url): url is string => Boolean(url))
  )
  const next = [...existing]
  for (const item of incoming) {
    const parsed = parseVideoEmbedUrl(item.url)
    if (!parsed.embedUrl || seen.has(parsed.embedUrl)) continue
    seen.add(parsed.embedUrl)
    next.push({ url: parsed.sourceUrl, caption: item.caption })
  }
  return next
}

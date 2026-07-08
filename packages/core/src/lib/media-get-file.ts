import path from "path"
import dbConnect from "@wse/core/lib/db"
import Media from "@wse/core/models/Media"
import { mediaBufferFromDoc } from "@wse/core/lib/media-buffer"
import type { MediaFilePayload } from "@wse/core/services/media"

const MEDIA_CACHE_TTL_MS = 1000 * 60 * 5
const MEDIA_CACHE_MAX_ENTRIES = 100
const mediaPayloadCache = new Map<string, { expiresAt: number; payload: MediaFilePayload }>()

function getCachedPayload(filename: string): MediaFilePayload | null {
  const cached = mediaPayloadCache.get(filename)
  if (!cached) return null
  if (Date.now() >= cached.expiresAt) {
    mediaPayloadCache.delete(filename)
    return null
  }
  return cached.payload
}

function setCachedPayload(filename: string, payload: MediaFilePayload) {
  if (mediaPayloadCache.size >= MEDIA_CACHE_MAX_ENTRIES) {
    const oldest = mediaPayloadCache.keys().next().value
    if (oldest) mediaPayloadCache.delete(oldest)
  }
  mediaPayloadCache.set(filename, {
    expiresAt: Date.now() + MEDIA_CACHE_TTL_MS,
    payload,
  })
}

function guessMimeFromExt(ext: string): string {
  const e = ext.toLowerCase()
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg"
  if (e === ".png") return "image/png"
  if (e === ".webp") return "image/webp"
  if (e === ".gif") return "image/gif"
  if (e === ".svg") return "image/svg+xml"
  if (e === ".pdf") return "application/pdf"
  return "application/octet-stream"
}

/** Lightweight file lookup for `/api/media/[filename]` — avoids importing the full MediaService bundle. */
export async function getMediaFilePayload(filename: string): Promise<MediaFilePayload | null> {
  await dbConnect()
  const safe = path.basename(filename)
  if (!safe || safe !== filename) return null

  const cached = getCachedPayload(safe)
  if (cached) return cached

  const doc = await Media.findOne({ filename: safe })
    .select("data mimeType size updatedAt")
    .lean()
  if (!doc) return null

  const buffer = mediaBufferFromDoc(doc.data)
  if (!buffer) return null

  const payload: MediaFilePayload = {
    buffer,
    mimeType: doc.mimeType || guessMimeFromExt(path.extname(safe)),
    size: buffer.length,
    etag: `"${safe}-${doc.size || buffer.length}-${new Date(doc.updatedAt).getTime()}"`,
    lastModified: doc.updatedAt,
  }
  setCachedPayload(safe, payload)
  return payload
}

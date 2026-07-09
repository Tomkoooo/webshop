import path from "path"
import crypto from "crypto"
import dbConnect from "@wse/core/lib/db"
import Media from "@wse/core/models/Media"
import { hasMediaBuffer, mediaBufferFromDoc } from "@wse/core/lib/media-buffer"

export type MediaFilePayload = {
  buffer: Buffer
  mimeType: string
  size: number
  etag: string
  lastModified?: Date
}

/** Media rows are immutable once stored — cache payloads for the process lifetime. */
const MEDIA_CACHE_MAX_ENTRIES = 500
const mediaPayloadCache = new Map<string, MediaFilePayload>()

function getCachedPayload(filename: string): MediaFilePayload | null {
  return mediaPayloadCache.get(filename) ?? null
}

function setCachedPayload(filename: string, payload: MediaFilePayload) {
  if (mediaPayloadCache.size >= MEDIA_CACHE_MAX_ENTRIES) {
    const oldest = mediaPayloadCache.keys().next().value
    if (oldest) mediaPayloadCache.delete(oldest)
  }
  mediaPayloadCache.set(filename, payload)
}

export class MediaService {
  static async processUpload(buffer: Buffer, originalName: string, mimeType: string): Promise<string> {
    if (!buffer?.length) {
      throw new Error("Üres fájl — a feltöltés nem sikerült.")
    }

    await dbConnect()

    const hash = crypto.createHash("sha256").update(buffer).digest("hex")
    const safeMime = mimeType?.trim() || "application/octet-stream"

    const existing = await Media.findOne({ hash })
    if (existing) {
      if (!hasMediaBuffer(existing.data)) {
        existing.data = buffer
        existing.size = buffer.length
        existing.mimeType = safeMime
        await existing.save()
      }
      return existing.filename
    }

    const ext = path.extname(originalName || "") || ".bin"
    const filename = `${crypto.randomUUID()}${ext}`

    await Media.create({
      filename,
      originalName: originalName || filename,
      hash,
      mimeType: safeMime,
      size: buffer.length,
      data: buffer,
      useCount: 0,
    })

    return filename
  }

  /** Resolve file bytes for `/api/media/[filename]` — database only (no disk). */
  static async getFilePayload(filename: string): Promise<MediaFilePayload | null> {
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

    const payload = {
      buffer,
      mimeType: doc.mimeType || guessMimeFromExt(path.extname(safe)),
      size: buffer.length,
      etag: `"media-${safe}"`,
      lastModified: doc.updatedAt,
    }
    setCachedPayload(safe, payload)
    return payload
  }

  static async incrementUsage(filenames: string | string[]) {
    if (!filenames) return
    await dbConnect()
    const names = Array.isArray(filenames) ? filenames : [filenames]
    if (names.length === 0) return

    await Media.updateMany({ filename: { $in: names } }, { $inc: { useCount: 1 } })
  }

  static async decrementUsage(filenames: string | string[]) {
    if (!filenames) return
    await dbConnect()
    const names = Array.isArray(filenames) ? filenames : [filenames]
    if (names.length === 0) return

    await Media.updateMany({ filename: { $in: names } }, { $inc: { useCount: -1 } })

    await Media.deleteMany({
      filename: { $in: names },
      useCount: { $lte: 0 },
    })
  }

  static async syncUsage(oldImages: string[], newImages: string[]) {
    const added = newImages.filter((img) => !oldImages.includes(img))
    const removed = oldImages.filter((img) => !newImages.includes(img))

    if (added.length > 0) await this.incrementUsage(added)
    if (removed.length > 0) await this.decrementUsage(removed)
  }
}

function guessMimeFromExt(ext: string): string {
  const e = ext.toLowerCase()
  if (e === ".jpg" || e === ".jpeg") return "image/jpeg"
  if (e === ".png") return "image/png"
  if (e === ".webp") return "image/webp"
  if (e === ".gif") return "image/gif"
  if (e === ".svg") return "image/svg+xml"
  if (e === ".pdf") return "application/pdf"
  if (e === ".txt") return "text/plain; charset=utf-8"
  if (e === ".doc") return "application/msword"
  if (e === ".docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return "application/octet-stream"
}

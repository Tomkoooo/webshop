/** Normalize MongoDB / Mongoose buffer fields from `.lean()` or hydrated docs. */
export function mediaBufferFromDoc(data: unknown): Buffer | null {
  if (data == null) return null
  if (Buffer.isBuffer(data)) return data.length > 0 ? data : null
  if (data instanceof Uint8Array) {
    return data.length > 0 ? Buffer.from(data) : null
  }
  if (typeof data === "object") {
    const bin = data as { buffer?: Uint8Array | number[]; length?: number; _bsontype?: string }
    if (bin._bsontype === "Binary" && bin.buffer) {
      const buf = Buffer.from(bin.buffer)
      return buf.length > 0 ? buf : null
    }
    if (bin.buffer instanceof Uint8Array || Array.isArray(bin.buffer)) {
      const buf = Buffer.from(bin.buffer)
      return buf.length > 0 ? buf : null
    }
  }
  return null
}

export function hasMediaBuffer(data: unknown): boolean {
  return mediaBufferFromDoc(data) !== null
}

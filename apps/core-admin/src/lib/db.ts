import mongoose from "mongoose"

/**
 * Core admin uses its own database (CORE_ADMIN_DATABASE_URL) — it never
 * connects to customer site databases; all site data flows through each
 * site's /api/management surface.
 */

declare global {
  // eslint-disable-next-line no-var
  var coreAdminMongoose: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } | undefined
}

const cached = (globalThis.coreAdminMongoose ??= { conn: null, promise: null })

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    const uri = process.env.CORE_ADMIN_DATABASE_URL
    if (!uri) throw new Error("Missing environment variable: CORE_ADMIN_DATABASE_URL")
    cached.promise = mongoose.connect(uri, { bufferCommands: false })
  }
  cached.conn = await cached.promise
  return cached.conn
}

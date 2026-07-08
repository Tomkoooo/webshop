import { Types } from "mongoose"
import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"

export type EnsureUserProfileInput = {
  id?: string | null
  email?: string | null
  name?: string | null
  image?: string | null
}

/**
 * Ensures a Mongoose `users` document exists with engine defaults (role, newsletter flags).
 * Auth.js OAuth may create a minimal row via the MongoDB adapter; this fills in missing fields.
 */
export async function ensureUserProfile(input: EnsureUserProfileInput): Promise<string | null> {
  const email = input.email?.trim().toLowerCase()
  if (!email) return null

  await dbConnect()

  const byId =
    input.id && Types.ObjectId.isValid(input.id) ? await User.findById(input.id).lean() : null
  const byEmail = await User.findOne({ email }).lean()
  const existing = byId ?? byEmail

  const profilePatch: Record<string, unknown> = { email }
  if (input.name?.trim()) profilePatch.name = input.name.trim()
  if (input.image?.trim()) profilePatch.image = input.image.trim()

  if (existing) {
    const set: Record<string, unknown> = { ...profilePatch }
    if (!existing.role) set.role = "USER"
    if (existing.newsletterSubscribed === undefined) set.newsletterSubscribed = false
    await User.findByIdAndUpdate(existing._id, { $set: set })
    return String(existing._id)
  }

  const created = await User.create({
    ...profilePatch,
    role: "USER",
    newsletterSubscribed: false,
  })
  return String(created._id)
}

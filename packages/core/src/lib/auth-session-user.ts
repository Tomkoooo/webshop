import type { Session } from "next-auth"
import mongoose from "mongoose"
import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"

/** Resolve Mongo user id for API routes (matches profile route fallback). */
export async function resolveAuthenticatedUserId(
  session: Session | null
): Promise<string | null> {
  if (!session?.user) return null

  const fromSession = session.user.id?.trim()
  if (fromSession && mongoose.Types.ObjectId.isValid(fromSession)) return fromSession

  const email = session.user.email?.trim()
  if (!email) return null

  await dbConnect()
  const user = await User.findOne({ email }).select("_id").lean()
  return user?._id?.toString() ?? null
}

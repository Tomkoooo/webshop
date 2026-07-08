import { Types } from "mongoose"
import clientPromise from "@wse/core/lib/mongodb"
import dbConnect from "@wse/core/lib/db"
import User from "@wse/core/models/User"
import { ensureUserProfile } from "@wse/core/lib/ensure-user-profile"

export type AuthAccountRepairResult = {
  profilesEnsured: number
  orphanedAccountsRemoved: number
}

/**
 * Backfill missing profile fields and remove OAuth account rows that reference deleted users.
 */
export async function repairAuthAccounts(): Promise<AuthAccountRepairResult> {
  await dbConnect()
  const client = await clientPromise
  const db = client.db()
  const accountsCol = db.collection("accounts")
  const usersCol = db.collection("users")

  let profilesEnsured = 0
  let orphanedAccountsRemoved = 0

  const rawUsers = await usersCol.find({}).toArray()
  for (const row of rawUsers) {
    const email = typeof row.email === "string" ? row.email : null
    if (!email) continue
    const id = row._id ? String(row._id) : undefined
    const before = await User.findById(id ?? row._id).lean()
    await ensureUserProfile({
      id,
      email,
      name: typeof row.name === "string" ? row.name : null,
      image: typeof row.image === "string" ? row.image : null,
    })
    const after = await User.findOne({ email }).lean()
    if (after && (!before?.role || before.newsletterSubscribed === undefined)) {
      profilesEnsured += 1
    }
  }

  const accounts = await accountsCol.find({}).toArray()
  for (const account of accounts) {
    const userId = account.userId
    if (!userId || !Types.ObjectId.isValid(String(userId))) {
      await accountsCol.deleteOne({ _id: account._id })
      orphanedAccountsRemoved += 1
      continue
    }
    const user = await usersCol.findOne({ _id: userId })
    if (!user) {
      await accountsCol.deleteOne({ _id: account._id })
      orphanedAccountsRemoved += 1
    }
  }

  return { profilesEnsured, orphanedAccountsRemoved }
}

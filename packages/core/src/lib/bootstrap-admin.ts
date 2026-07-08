import clientPromise from "@wse/core/lib/mongodb"

export const BOOTSTRAP_ADMIN_ENV = "BOOTSTRAP_ADMIN_EMAILS"

/** Parse comma-, semicolon-, or newline-separated admin allowlist from env. */
export function parseBootstrapAdminEmails(value: string | undefined): string[] {
  if (!value?.trim()) return []

  const seen = new Set<string>()
  const emails: string[] = []

  for (const part of value.split(/[,;\n]+/)) {
    const email = part.trim().toLowerCase()
    if (!email || seen.has(email)) continue
    seen.add(email)
    emails.push(email)
  }

  return emails
}

export function getBootstrapAdminEmails(): string[] {
  return parseBootstrapAdminEmails(process.env[BOOTSTRAP_ADMIN_ENV])
}

/**
 * Promote the signing-in user to ADMIN when their email is on
 * `BOOTSTRAP_ADMIN_EMAILS` (comma-separated allowlist). Idempotent and safe
 * to call on sign-in. Leaving the env var set after onboarding does not affect
 * login — it only promotes allowlisted users who are not yet ADMIN.
 */
export async function maybeBootstrapAdmin(email: string | undefined | null): Promise<void> {
  const allowlist = getBootstrapAdminEmails()
  if (allowlist.length === 0) return
  const candidateEmail = (email || "").trim().toLowerCase()
  if (!candidateEmail || !allowlist.includes(candidateEmail)) return

  try {
    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    const candidateUser = await users.findOne({ email: candidateEmail })
    if (!candidateUser || candidateUser.role === "ADMIN") return

    const result = await users.updateOne(
      { email: candidateEmail },
      { $set: { role: "ADMIN" } }
    )
    if (result.matchedCount > 0) {
      console.info(
        `[bootstrap-admin] Promoted '${candidateEmail}' to ADMIN via ${BOOTSTRAP_ADMIN_ENV}.`
      )
    }
  } catch (error) {
    console.error("[bootstrap-admin] Failed to bootstrap admin role:", error)
  }
}

import clientPromise from "@wse/core/lib/mongodb"

export const BOOTSTRAP_ADMIN_ENV = "BOOTSTRAP_ADMIN_EMAILS"
export const BOOTSTRAP_SYSTEM_ADMIN_ENV = "BOOTSTRAP_SYSTEM_ADMIN_EMAILS"

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
  const system = parseBootstrapAdminEmails(process.env[BOOTSTRAP_SYSTEM_ADMIN_ENV])
  if (system.length > 0) return system
  return parseBootstrapAdminEmails(process.env[BOOTSTRAP_ADMIN_ENV])
}

/**
 * Promote the signing-in user when their email is on the bootstrap allowlist.
 * For multi-tenant tBook: sets `isSystemAdmin`. Legacy deployments: sets `role: ADMIN`.
 */
export async function maybeBootstrapAdmin(email: string | undefined | null): Promise<void> {
  const allowlist = getBootstrapAdminEmails()
  if (allowlist.length === 0) return
  const candidateEmail = (email || "").trim().toLowerCase()
  if (!candidateEmail || !allowlist.includes(candidateEmail)) return

  try {
    const { isMultiTenantAdminEnabled } = await import("@wse/core/lib/site-features")
    const client = await clientPromise
    const db = client.db()
    const users = db.collection("users")

    const candidateUser = await users.findOne({ email: candidateEmail })
    if (!candidateUser) return

    if (isMultiTenantAdminEnabled()) {
      if (candidateUser.isSystemAdmin === true) return
      const result = await users.updateOne(
        { email: candidateEmail },
        { $set: { isSystemAdmin: true } }
      )
      if (result.matchedCount > 0) {
        console.info(
          `[bootstrap-admin] Promoted '${candidateEmail}' to system admin via bootstrap allowlist.`
        )
      }
      return
    }

    if (candidateUser.role === "ADMIN") return

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

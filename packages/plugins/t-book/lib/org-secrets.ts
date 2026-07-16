import crypto from "node:crypto"

const PREFIX = "enc:v1:"

function encryptionKey(): Buffer {
  const raw =
    process.env.TBOOK_ORG_SECRETS_KEY?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "tbook-org-secrets-dev-key"
  return crypto.createHash("sha256").update(raw).digest()
}

/** Encrypt a secret for storage on the organization document. */
export function encryptOrgSecret(plain: string): string {
  const value = plain.trim()
  if (!value) return ""
  if (value.startsWith(PREFIX)) return value
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`
}

export function decryptOrgSecret(stored: string | null | undefined): string {
  const value = String(stored ?? "").trim()
  if (!value) return ""
  if (!value.startsWith(PREFIX)) return value
  const payload = value.slice(PREFIX.length)
  const [ivB64, tagB64, dataB64] = payload.split(".")
  if (!ivB64 || !tagB64 || !dataB64) return ""
  try {
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivB64, "base64url")
    )
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"))
    return Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64url")),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    return ""
  }
}

/** Mask for admin UI — never return full secrets to the client. */
export function maskSecret(stored: string | null | undefined): {
  configured: boolean
  hint: string
} {
  const plain = decryptOrgSecret(stored)
  if (!plain) return { configured: false, hint: "" }
  if (plain.length <= 8) return { configured: true, hint: "••••••••" }
  return { configured: true, hint: `${plain.slice(0, 4)}…${plain.slice(-4)}` }
}

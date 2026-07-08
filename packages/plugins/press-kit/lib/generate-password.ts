import { randomBytes } from "crypto"

const CHARSET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"

export function generateReadablePassword(length = 10): string {
  const bytes = randomBytes(length)
  let out = ""
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i]! % CHARSET.length]
  }
  return out
}

export function generateAccessToken(): string {
  return randomBytes(24).toString("base64url")
}

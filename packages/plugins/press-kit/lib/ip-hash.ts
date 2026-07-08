import { createHash } from "crypto"

export function hashClientIp(ip: string | null | undefined): string | undefined {
  const trimmed = ip?.trim()
  if (!trimmed) return undefined
  const salt = process.env.PRESS_KIT_IP_SALT || process.env.AUTH_SECRET || "press-ip-salt"
  return createHash("sha256").update(`${salt}:${trimmed}`).digest("hex").slice(0, 32)
}

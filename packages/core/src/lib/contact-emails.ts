import { hasContactFieldValue } from "@wse/core/lib/contact-display"

export type ContactEmailEntry = {
  id: string
  label: string
  email: string
}

const CONTACT_EMAILS_KEY = "contact_emails"

export function contactEmailsStorageKey(): string {
  return CONTACT_EMAILS_KEY
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

function normalizeEntry(raw: unknown): ContactEmailEntry | null {
  if (!raw || typeof raw !== "object") return null
  const row = raw as Record<string, unknown>
  const email = String(row.email ?? "").trim()
  if (!isValidEmail(email)) return null
  const label = String(row.label ?? "").trim() || email
  const id = String(row.id ?? "").trim() || crypto.randomUUID()
  return { id, label, email }
}

/** Parse `contact_emails` JSON from ShopContent; falls back to legacy `contact_email`. */
export function parseContactEmailsFromShopContent(
  content: Record<string, string | undefined>
): ContactEmailEntry[] {
  const rawJson = content[CONTACT_EMAILS_KEY]
  if (rawJson?.trim()) {
    try {
      const parsed = JSON.parse(rawJson) as unknown
      if (Array.isArray(parsed)) {
        const entries = parsed.map(normalizeEntry).filter((e): e is ContactEmailEntry => Boolean(e))
        if (entries.length > 0) return entries
      }
    } catch {
      /* fall through */
    }
  }

  const legacy = String(content.contact_email ?? "").trim()
  if (hasContactFieldValue(legacy) && isValidEmail(legacy)) {
    return [{ id: "legacy", label: "Általános", email: legacy }]
  }
  return []
}

export function serializeContactEmails(entries: ContactEmailEntry[]): string {
  return JSON.stringify(
    entries.map((entry) => ({
      id: entry.id,
      label: entry.label.trim() || entry.email.trim(),
      email: entry.email.trim(),
    }))
  )
}

/** Primary shop contact for ops alerts (first configured entry). */
export function primaryContactEmail(entries: ContactEmailEntry[]): string {
  return entries[0]?.email?.trim() ?? ""
}

export function formatContactEmailsForDisplay(entries: ContactEmailEntry[]): string {
  if (entries.length === 0) return ""
  if (entries.length === 1) return entries[0].email
  return entries.map((e) => (e.label && e.label !== e.email ? `${e.label}: ${e.email}` : e.email)).join(" · ")
}

export function findContactEmailById(
  entries: ContactEmailEntry[],
  id: string | undefined
): ContactEmailEntry | undefined {
  if (!id) return entries[0]
  return entries.find((e) => e.id === id) ?? entries[0]
}

const NEW_ORDER_NOTIFICATION_EMAILS_KEY = "new_order_notification_emails"

export function newOrderNotificationEmailsStorageKey(): string {
  return NEW_ORDER_NOTIFICATION_EMAILS_KEY
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function parseNewOrderNotificationEmailsFromShopContent(
  content: Record<string, string | undefined>
): string[] {
  const rawJson = content[NEW_ORDER_NOTIFICATION_EMAILS_KEY]
  if (!rawJson?.trim()) return []

  try {
    const parsed = JSON.parse(rawJson) as unknown
    if (!Array.isArray(parsed)) return []
    const emails = parsed
      .map((row) => String(row ?? "").trim())
      .filter((email) => isValidEmail(email))
    return [...new Set(emails)]
  } catch {
    return []
  }
}

export function serializeNewOrderNotificationEmails(emails: string[]): string {
  const normalized = emails
    .map((email) => email.trim())
    .filter((email) => isValidEmail(email))
  return JSON.stringify([...new Set(normalized)])
}

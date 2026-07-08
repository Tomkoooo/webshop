const INVOICE_ERROR_ALERT_EMAILS_KEY = "invoice_error_alert_emails"

export function invoiceErrorAlertEmailsStorageKey(): string {
  return INVOICE_ERROR_ALERT_EMAILS_KEY
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Parse dedicated invoice-failure alert recipients from ShopContent (JSON string array). */
export function parseInvoiceErrorAlertEmailsFromShopContent(
  content: Record<string, string | undefined>
): string[] {
  const rawJson = content[INVOICE_ERROR_ALERT_EMAILS_KEY]
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

export function serializeInvoiceErrorAlertEmails(emails: string[]): string {
  const normalized = emails
    .map((email) => email.trim())
    .filter((email) => isValidEmail(email))
  return JSON.stringify([...new Set(normalized)])
}

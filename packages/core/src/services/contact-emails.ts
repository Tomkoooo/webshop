import dbConnect from "@wse/core/lib/db"
import {
  parseContactEmailsFromShopContent,
  serializeContactEmails,
  type ContactEmailEntry,
} from "@wse/core/lib/contact-emails"
import {
  parseInvoiceErrorAlertEmailsFromShopContent,
  serializeInvoiceErrorAlertEmails,
} from "@wse/core/lib/invoice-error-alert-emails"
import {
  parseNewOrderNotificationEmailsFromShopContent,
  serializeNewOrderNotificationEmails,
} from "@wse/core/lib/new-order-notification-emails"
import { ShopContentService } from "@wse/core/services/shop-content"

export class ContactEmailsService {
  static async list(): Promise<ContactEmailEntry[]> {
    const content = await ShopContentService.getAll()
    return parseContactEmailsFromShopContent(content)
  }

  static async listInvoiceErrorAlertEmails(): Promise<string[]> {
    const content = await ShopContentService.getAll()
    return parseInvoiceErrorAlertEmailsFromShopContent(content)
  }

  static async listNewOrderNotificationEmails(): Promise<string[]> {
    const content = await ShopContentService.getAll()
    return parseNewOrderNotificationEmailsFromShopContent(content)
  }

  static async save(entries: ContactEmailEntry[]): Promise<ContactEmailEntry[]> {
    const normalized = entries
      .map((entry) => ({
        id: entry.id.trim() || crypto.randomUUID(),
        label: entry.label.trim(),
        email: entry.email.trim(),
      }))
      .filter((entry) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(entry.email))

    await dbConnect()
    await ShopContentService.update(
      "contact_emails",
      serializeContactEmails(normalized),
      "contact"
    )
    await ShopContentService.update(
      "contact_email",
      normalized[0]?.email ?? "",
      "contact"
    )
    return normalized
  }

  static async saveInvoiceErrorAlertEmails(emails: string[]): Promise<string[]> {
    const normalized = emails
      .map((email) => email.trim())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

    await dbConnect()
    await ShopContentService.update(
      "invoice_error_alert_emails",
      serializeInvoiceErrorAlertEmails(normalized),
      "contact"
    )
    return [...new Set(normalized)]
  }

  static async saveNewOrderNotificationEmails(emails: string[]): Promise<string[]> {
    const normalized = emails
      .map((email) => email.trim())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

    await dbConnect()
    await ShopContentService.update(
      "new_order_notification_emails",
      serializeNewOrderNotificationEmails(normalized),
      "contact"
    )
    return [...new Set(normalized)]
  }
}

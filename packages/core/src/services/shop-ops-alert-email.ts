import dbConnect from "@wse/core/lib/db";
import { parseContactEmailsFromShopContent, primaryContactEmail } from "@wse/core/lib/contact-emails";
import { parseInvoiceErrorAlertEmailsFromShopContent } from "@wse/core/lib/invoice-error-alert-emails";
import { ShopContentService } from "@wse/core/services/shop-content";

/** Shop CMS contact or env override (order placement failures and other ops alerts). */
export async function resolveShopOpsAlertEmail(): Promise<string> {
  await dbConnect();
  const content = await ShopContentService.getAll();
  const fromList = primaryContactEmail(parseContactEmailsFromShopContent(content));
  return String(fromList || content.contact_email || process.env.INVOICE_ERROR_ALERT_EMAIL || "").trim();
}

/**
 * Recipients for automatic invoicing failure alerts.
 * Uses CMS `invoice_error_alert_emails` when set; otherwise the general shop ops inbox.
 */
export async function resolveInvoiceErrorAlertEmails(): Promise<string[]> {
  await dbConnect();
  const content = await ShopContentService.getAll();
  const dedicated = parseInvoiceErrorAlertEmailsFromShopContent(content);
  if (dedicated.length > 0) return dedicated;

  const fallback = await resolveShopOpsAlertEmail();
  return fallback ? [fallback] : [];
}

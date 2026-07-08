import dbConnect from "@wse/core/lib/db"
import { parseNewOrderNotificationEmailsFromShopContent } from "@wse/core/lib/new-order-notification-emails"
import { formatOrderNumber } from "@wse/core/lib/order-number"
import { logMailer, serializeMailerError } from "@wse/core/lib/mailer-log"
import Order from "@wse/core/models/Order"
import { MailerService } from "@wse/core/services/mailer"
import { ShopContentService } from "@wse/core/services/shop-content"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {}
}

function formatMoney(value: unknown): string {
  const numeric = typeof value === "number" ? value : Number(value)
  return Number.isFinite(numeric) ? `${numeric.toLocaleString("hu-HU")} Ft` : String(value ?? "")
}

function textValue(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value)
}

function adminBaseUrl(): string {
  let base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ""
  if (!base && process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, "")
    base = `https://${host}`
  }
  return base.replace(/\/$/, "")
}

function adminOrderUrl(orderId: string): string {
  const base = adminBaseUrl()
  return base ? `${base}/admin/orders/${orderId}` : ""
}

function formatAddress(raw: unknown): string {
  const address = asRecord(raw)
  return [address.zip, address.city, address.street].map(textValue).filter(Boolean).join(" ")
}

function formatMethod(raw: unknown): string {
  const method = asRecord(raw)
  return textValue(method.name || raw)
}

function buildLineItems(order: Record<string, unknown>): string[] {
  const items = Array.isArray(order.items) ? order.items : []
  return items.map((raw) => {
    const item = asRecord(raw)
    const name = textValue(item.name) || "Termék"
    const variant = textValue(item.variantLabel)
    const quantity = textValue(item.quantity) || "1"
    const price = formatMoney(item.price)
    return `${name}${variant ? ` [${variant}]` : ""} × ${quantity} - ${price}`
  })
}

export async function resolveNewOrderNotificationEmails(): Promise<string[]> {
  await dbConnect()
  const content = await ShopContentService.getAll()
  return parseNewOrderNotificationEmailsFromShopContent(content)
}

export function buildNewOrderNotificationEmailBodies(order: Record<string, unknown>) {
  const orderId = textValue(order._id)
  const orderNumber = formatOrderNumber(orderId)
  const billing = asRecord(order.billingInfo)
  const shipping = asRecord(order.shippingAddress)
  const user = asRecord(order.user)
  const lines = buildLineItems(order)
  const adminUrl = adminOrderUrl(orderId)
  const customerName = textValue(user.name) || textValue(billing.name) || textValue(shipping.name)
  const customerEmail = textValue(user.email) || textValue(billing.email) || textValue(shipping.email)

  const text = [
    "Új rendelés érkezett.",
    "",
    `Rendelés: ${orderNumber}`,
    `MongoDB id: ${orderId}`,
    adminUrl ? `Admin: ${adminUrl}` : "",
    "",
    `Vevő: ${customerName}`,
    `E-mail: ${customerEmail}`,
    `Telefon: ${textValue(billing.phone) || textValue(shipping.phone)}`,
    "",
    `Számlázási cím: ${formatAddress(billing)}`,
    `Szállítási cím: ${formatAddress(shipping)}`,
    textValue(shipping.comment) ? `Megjegyzés: ${textValue(shipping.comment)}` : "",
    "",
    `Fizetés: ${formatMethod(order.paymentMethod)}`,
    `Szállítás: ${formatMethod(order.shippingMethod)}`,
    "",
    `Részösszeg: ${formatMoney(order.subtotal)}`,
    `Szállítás: ${formatMoney(order.shippingFee)}`,
    `Fizetési díj: ${formatMoney(order.paymentFee)}`,
    `Kedvezmény: ${formatMoney(order.discount)}`,
    `Összesen: ${formatMoney(order.total)}`,
    "",
    "Tételek:",
    ...lines.map((line) => `- ${line}`),
  ]
    .filter(Boolean)
    .join("\n")

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">
  <h1 style="font-size:20px;margin:0 0 12px">Új rendelés érkezett</h1>
  <table style="border-collapse:collapse;margin:12px 0">
    <tr><td style="padding:4px 12px 4px 0"><strong>Rendelés</strong></td><td>${escapeHtml(orderNumber)}</td></tr>
    <tr><td style="padding:4px 12px 4px 0"><strong>Összesen</strong></td><td>${escapeHtml(formatMoney(order.total))}</td></tr>
    ${
      adminUrl ?
        `<tr><td style="padding:4px 12px 4px 0"><strong>Admin</strong></td><td><a href="${escapeHtml(adminUrl)}">${escapeHtml(adminUrl)}</a></td></tr>`
      : ""
    }
  </table>
  <h2 style="font-size:15px;margin-top:20px">Vevő</h2>
  <p>${escapeHtml(customerName)}<br>${escapeHtml(customerEmail)}<br>${escapeHtml(textValue(billing.phone) || textValue(shipping.phone))}</p>
  <h2 style="font-size:15px;margin-top:20px">Címek</h2>
  <p><strong>Számlázás:</strong> ${escapeHtml(formatAddress(billing))}<br>
  <strong>Szállítás:</strong> ${escapeHtml(formatAddress(shipping))}</p>
  ${textValue(shipping.comment) ? `<p><strong>Megjegyzés:</strong> ${escapeHtml(textValue(shipping.comment))}</p>` : ""}
  <h2 style="font-size:15px;margin-top:20px">Fizetés és szállítás</h2>
  <p>${escapeHtml(formatMethod(order.paymentMethod))} · ${escapeHtml(formatMethod(order.shippingMethod))}</p>
  <h2 style="font-size:15px;margin-top:20px">Tételek</h2>
  <ul>${lines.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>
  <p><strong>Összesen:</strong> ${escapeHtml(formatMoney(order.total))}</p>
</body></html>`.trim()

  return { html, text, subject: `Új rendelés: ${orderNumber}` }
}

export async function sendNewOrderNotification(orderId: unknown) {
  const id = String(orderId || "")
  try {
    const recipients = await resolveNewOrderNotificationEmails()
    if (recipients.length === 0) {
      logMailer("info", "new_order_notification_skipped", {
        flow: "new_order_notification",
        reason: "no_recipients",
        orderId: id,
      })
      return
    }

    const order = await Order.findById(orderId).populate("paymentMethod shippingMethod user").lean()
    if (!order) {
      logMailer("warn", "new_order_notification_skipped", {
        flow: "new_order_notification",
        reason: "order_not_found",
        orderId: id,
      })
      return
    }

    const bodies = buildNewOrderNotificationEmailBodies(order as Record<string, unknown>)
    await MailerService.sendSystemHtmlEmail({
      to: recipients.join(", "),
      subject: bodies.subject,
      html: bodies.html,
      text: bodies.text,
      logContext: { flow: "new_order_notification", orderId: id },
    })
  } catch (error) {
    logMailer("error", "new_order_notification_failed", {
      flow: "new_order_notification",
      orderId: id,
      error: serializeMailerError(error),
    })
  }
}

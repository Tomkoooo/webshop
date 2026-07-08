import Order from "@wse/core/models/Order";
import { formatOrderNumber } from "@wse/core/lib/order-number";
import { logMailer, serializeMailerError } from "@wse/core/lib/mailer-log";
import { MailerService } from "@wse/core/services/mailer";
import { resolveInvoiceErrorAlertEmails } from "@wse/core/services/shop-ops-alert-email";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(n: unknown): string {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x.toLocaleString("hu-HU") : String(n ?? "");
}

function errorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error ?? "unknown") };
}

function buildLines(order: Record<string, any>): string[] {
  const lines: string[] = [];
  const items = Array.isArray(order.items) ? order.items : [];
  for (const line of items) {
    const label = line.variantLabel ? `${line.name} [${line.variantLabel}]` : line.name;
    lines.push(`- ${label} × ${line.quantity} @ ${formatMoney(line.price)}`);
  }
  return lines;
}

function adminOrderBase(): string {
  let base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "";
  if (!base && process.env.VERCEL_URL) {
    const host = process.env.VERCEL_URL.replace(/^https?:\/\//, "");
    base = `https://${host}`;
  }
  return base.replace(/\/$/, "");
}

function adminOrderUrl(orderId: string): string {
  const normalized = adminOrderBase();
  if (!normalized) return "";
  return `${normalized}/admin/orders/${orderId}`;
}

export function buildInvoiceErrorEmailBodies(order: Record<string, any>, error: unknown) {
  const id = String(order._id ?? "");
  const orderNo = formatOrderNumber(id);
  const pm = order.paymentMethod as { name?: string } | undefined;
  const sm = order.shippingMethod as { name?: string } | undefined;
  const user = order.user as { email?: string; name?: string } | undefined;
  const bi = order.billingInfo || {};
  const ship = order.shippingAddress || {};
  const { message, stack } = errorDetails(error);
  const storedErr = order.invoiceLastError ? String(order.invoiceLastError) : "";

  const textParts = [
    "Automatic invoicing failed for an order.",
    "",
    `Order MongoDB id: ${id}`,
    `Display order number: ${orderNo}`,
    adminOrderUrl(id) ? `Admin: ${adminOrderUrl(id)}` : "",
    "",
    "Error (message):",
    message,
    "",
    storedErr && storedErr !== message ? `Stored on order (invoiceLastError):\n${storedErr}\n` : "",
    stack ? `Stack trace:\n${stack}` : "",
    "",
    "Customer account (if any):",
    `  Name: ${user?.name || ""}`,
    `  Email: ${user?.email || ""}`,
    "",
    "Billing (invoice / buyer data):",
    `  Type: ${bi.type || ""}`,
    `  Name: ${bi.name || ""}`,
    `  Tax number: ${bi.taxNumber || ""}`,
    `  Email: ${bi.email || ""}`,
    `  Phone: ${bi.phone || ""}`,
    `  Address: ${bi.zip || ""} ${bi.city || ""}, ${bi.street || ""}`,
    "",
    "Shipping:",
    `  Name: ${ship.name || ""}`,
    `  Email: ${ship.email || ""}`,
    `  Phone: ${ship.phone || ""}`,
    `  Address: ${ship.zip || ""} ${ship.city || ""}, ${ship.street || ""}`,
    ship.comment ? `  Comment: ${ship.comment}` : "",
    "",
    `Payment method: ${pm?.name || String(order.paymentMethod || "")}`,
    `Shipping method: ${sm?.name || String(order.shippingMethod || "")}`,
    "",
    `Subtotal: ${formatMoney(order.subtotal)}  Shipping: ${formatMoney(order.shippingFee)}  Fees: ${formatMoney(order.paymentFee)}  Discount: ${formatMoney(order.discount)}  Total: ${formatMoney(order.total)}`,
    "",
    "Line items:",
    ...buildLines(order),
  ].filter(Boolean);

  const text = textParts.join("\n");

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">
  <h1 style="font-size:18px">INVOICE ERROR</h1>
  <p>Automatic invoicing failed. Use the details below to fix the integration or issue the invoice manually.</p>
  <table style="border-collapse:collapse;margin:12px 0">
    <tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>Order id</strong></td><td><code>${escapeHtml(id)}</code></td></tr>
    <tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>Order #</strong></td><td>${escapeHtml(orderNo)}</td></tr>
    ${
      adminOrderUrl(id) ?
        `<tr><td style="padding:4px 12px 4px 0;vertical-align:top"><strong>Admin</strong></td><td><a href="${escapeHtml(adminOrderUrl(id))}">${escapeHtml(adminOrderUrl(id))}</a></td></tr>`
      : ""
    }
  </table>
  <h2 style="font-size:15px;margin-top:20px">Error</h2>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</pre>
  ${
    storedErr && storedErr !== message ?
      `<p><strong>invoiceLastError on order</strong></p><pre style="background:#fef2f2;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(storedErr)}</pre>`
    : ""
  }
  ${
    stack ?
      `<h2 style="font-size:15px;margin-top:20px">Stack</h2><pre style="background:#f4f4f5;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(stack)}</pre>`
    : ""
  }
  <h2 style="font-size:15px;margin-top:20px">Billing (for invoice)</h2>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(
    [
      `Type: ${bi.type || ""}`,
      `Name: ${bi.name || ""}`,
      `Tax: ${bi.taxNumber || ""}`,
      `Email: ${bi.email || ""}`,
      `Phone: ${bi.phone || ""}`,
      `${bi.zip || ""} ${bi.city || ""}, ${bi.street || ""}`,
    ].join("\n")
  )}</pre>
  <h2 style="font-size:15px;margin-top:20px">Shipping</h2>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(
    [
      `Name: ${ship.name || ""}`,
      `Email: ${ship.email || ""}`,
      `Phone: ${ship.phone || ""}`,
      `${ship.zip || ""} ${ship.city || ""}, ${ship.street || ""}`,
      ship.comment ? `Comment: ${ship.comment}` : "",
    ]
      .filter(Boolean)
      .join("\n")
  )}</pre>
  <h2 style="font-size:15px;margin-top:20px">Account</h2>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(
    [`Name: ${user?.name || ""}`, `Email: ${user?.email || ""}`].join("\n")
  )}</pre>
  <p><strong>Totals</strong> — Subtotal ${escapeHtml(formatMoney(order.subtotal))}, shipping ${escapeHtml(
    formatMoney(order.shippingFee)
  )}, payment fee ${escapeHtml(formatMoney(order.paymentFee))}, discount ${escapeHtml(
    formatMoney(order.discount)
  )}, <strong>total ${escapeHtml(formatMoney(order.total))}</strong></p>
  <p><strong>Methods</strong> — Payment: ${escapeHtml(pm?.name || String(order.paymentMethod || ""))}; Shipping: ${escapeHtml(
    sm?.name || String(order.shippingMethod || "")
  )}</p>
  <h2 style="font-size:15px;margin-top:20px">Line items</h2>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap">${escapeHtml(
    buildLines(order).join("\n") || "(none)"
  )}</pre>
</body></html>`.trim();

  return { html, text };
}

/**
 * Email CMS invoice-error recipients (or shop contact / `INVOICE_ERROR_ALERT_EMAIL`) when invoicing fails.
 */
export async function sendInvoiceErrorShopAlert(orderId: unknown, error: unknown) {
  try {
    const recipients = await resolveInvoiceErrorAlertEmails();
    if (recipients.length === 0) {
      logMailer("warn", "invoice_error_alert_skipped", {
        reason: "no_shop_ops_email",
        orderId: String(orderId),
      });
      return;
    }

    const order = await Order.findById(orderId).populate("paymentMethod shippingMethod user").lean();
    if (!order) {
      logMailer("warn", "invoice_error_alert_skipped", {
        reason: "order_not_found",
        orderId: String(orderId),
      });
      return;
    }

    const bodies = buildInvoiceErrorEmailBodies(order as Record<string, any>, error);
    await MailerService.sendSystemHtmlEmail({
      to: recipients.join(", "),
      subject: "INVOICE ERROR",
      html: bodies.html,
      text: bodies.text,
      logContext: { flow: "invoice_error_alert", orderId: String(orderId) },
    });
  } catch (e) {
    logMailer("error", "invoice_error_alert_failed", {
      flow: "invoice_error_alert",
      orderId: String(orderId),
      error: serializeMailerError(e),
    });
  }
}

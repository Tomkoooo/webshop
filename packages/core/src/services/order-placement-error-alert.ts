import { logMailer, serializeMailerError } from "@wse/core/lib/mailer-log";
import { MailerService } from "@wse/core/services/mailer";
import { resolveShopOpsAlertEmail } from "@wse/core/services/shop-ops-alert-email";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function errorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }
  return { message: String(error ?? "unknown") };
}

function summarizeCheckoutPayload(orderData: unknown): Record<string, unknown> {
  if (!orderData || typeof orderData !== "object") return { note: "no checkout payload" };
  const o = orderData as Record<string, any>;
  const pickAddr = (a: any) =>
    a && typeof a === "object" ?
      {
        type: a.type,
        name: a.name,
        email: a.email,
        phone: a.phone,
        taxNumber: a.taxNumber,
        zip: a.zip,
        city: a.city,
        street: a.street,
        comment: a.comment,
      }
    : {};

  const items = Array.isArray(o.items) ?
    o.items.map((i: any) => ({
      product: i.product != null ? String(i.product) : "",
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      variantId: i.variantId,
      variantLabel: i.variantLabel,
    }))
  : [];

  return {
    items,
    billingInfo: pickAddr(o.billingInfo),
    shippingAddress: pickAddr(o.shippingAddress),
    subtotal: o.subtotal,
    shippingFee: o.shippingFee,
    paymentFee: o.paymentFee,
    discount: o.discount,
    total: o.total,
    couponCodes: o.couponCodes,
    shippingMethod: o.shippingMethod != null ? String(o.shippingMethod) : undefined,
    paymentMethod: o.paymentMethod != null ? String(o.paymentMethod) : undefined,
    glsParcelPoint:
      o.glsParcelPoint && typeof o.glsParcelPoint === "object" ?
        { id: o.glsParcelPoint.id, name: o.glsParcelPoint.name }
        : undefined,
    foxpostParcelPoint:
      o.foxpostParcelPoint && typeof o.foxpostParcelPoint === "object"
        ? { id: o.foxpostParcelPoint.id, name: o.foxpostParcelPoint.name }
        : undefined,
  };
}

export type OrderPlacementAlertContext = {
  error: unknown;
  orderData: unknown;
  userId?: string;
  /** Set once the order document has been written (after `save()`). */
  orderPersisted: boolean;
  /** Mongo id from the in-memory order document when available (may exist before save). */
  orderId?: string;
  checkoutOptions?: { enforceShopEnabled?: boolean; skipStockDecrement?: boolean };
};

export function buildOrderPlacementErrorEmailBodies(ctx: OrderPlacementAlertContext) {
  const { message, stack } = errorDetails(ctx.error);
  const summary = summarizeCheckoutPayload(ctx.orderData);
  const summaryJson = JSON.stringify(summary, null, 2);
  const opts = ctx.checkoutOptions || {};

  const textParts = [
    "Order placement failed before or during checkout finalization.",
    "",
    `Error: ${message}`,
    ctx.orderPersisted ? `Order was saved to DB (id: ${ctx.orderId || "unknown"})` : "Order was NOT saved (failure before or during save).",
    ctx.orderId && !ctx.orderPersisted ? `Draft/pre-save order id (if any): ${ctx.orderId}` : "",
    `Logged-in user id (if any): ${ctx.userId || "(guest)"}`,
    `enforceShopEnabled: ${opts.enforceShopEnabled !== false}  skipStockDecrement: ${Boolean(opts.skipStockDecrement)}`,
    "",
    stack ? `Stack:\n${stack}\n` : "",
    "Checkout payload (sanitized):",
    summaryJson,
  ].filter(Boolean);

  const text = textParts.join("\n");

  const persistLine = ctx.orderPersisted
    ? `The order document was persisted. Mongo id: <code>${escapeHtml(ctx.orderId || "")}</code>`
    : "The order document was <strong>not</strong> persisted (failure during validation, stock update, or save).";

  const html = `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;font-size:14px;line-height:1.5;color:#111">
  <h1 style="font-size:18px">ORDER PLACEMENT ERROR</h1>
  <p>Order placement failed. Use the error and checkout context below to debug or recover (e.g. payment succeeded but order missing).</p>
  <h2 style="font-size:15px;margin-top:16px">Error</h2>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px;white-space:pre-wrap;word-break:break-word">${escapeHtml(message)}</pre>
  ${
    stack ?
      `<h2 style="font-size:15px;margin-top:16px">Stack</h2><pre style="background:#f4f4f5;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(stack)}</pre>`
    : ""
  }
  <h2 style="font-size:15px;margin-top:16px">State</h2>
  <p>${persistLine}</p>
  <p><strong>User</strong> — ${escapeHtml(ctx.userId || "(guest checkout)")}</p>
  <p><strong>Checkout options</strong> — enforceShopEnabled: ${escapeHtml(String(opts.enforceShopEnabled !== false))};
    skipStockDecrement: ${escapeHtml(String(Boolean(opts.skipStockDecrement)))}</p>
  <h2 style="font-size:15px;margin-top:16px">Checkout payload (sanitized)</h2>
  <pre style="background:#f4f4f5;padding:12px;border-radius:8px;font-size:12px;white-space:pre-wrap;word-break:break-word">${escapeHtml(summaryJson)}</pre>
</body></html>`.trim();

  return { html, text };
}

export async function sendOrderPlacementErrorShopAlert(ctx: OrderPlacementAlertContext) {
  try {
    const to = await resolveShopOpsAlertEmail();
    if (!to) {
      logMailer("warn", "order_placement_alert_skipped", {
        reason: "no_shop_ops_email",
        hint: "Set CMS contact emails or INVOICE_ERROR_ALERT_EMAIL",
      });
      return;
    }
    const bodies = buildOrderPlacementErrorEmailBodies(ctx);
    await MailerService.sendSystemHtmlEmail({
      to,
      subject: "ORDER PLACEMENT ERROR",
      html: bodies.html,
      text: bodies.text,
      logContext: { flow: "order_placement_error_alert", orderId: ctx.orderId },
    });
  } catch (e) {
    logMailer("error", "order_placement_alert_failed", {
      flow: "order_placement_error_alert",
      orderId: ctx.orderId,
      error: serializeMailerError(e),
    });
  }
}

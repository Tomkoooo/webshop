import mongoose from "mongoose";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import TempOrder from "@/models/TempOrder";
import { ADMIN_ORDER_DELETED_STATUS, isAdminDeletedOrder } from "@/lib/admin-orders-filters";
import { recordOrderStatusChange } from "@/lib/order-status-history";
import { formatOrderNumber } from "@/lib/order-number";
import {
  releaseReservationsForTempOrder,
  restoreCheckoutLineStock,
} from "@/services/inventory-reservation";
import { buildCoreEmailTemplateSeeds } from "@/lib/email-template-catalog";
import { logMailer } from "@/lib/mailer-log";
import { EmailTemplateService } from "@/services/email-template";
import { InvoicingSzamlazzService } from "@/services/invoicing-szamlazz";
import { MailerService } from "@/services/mailer";
import { getStripeClient } from "@/services/stripe";

export type CancelOrderOptions = {
  reason?: string;
};

export type CancelOrderResult = {
  success: true;
  refunded: boolean;
  refundId?: string;
  invoiceReversed: boolean;
  reversalInvoiceId?: string;
  stockRestored: boolean;
  cancellationReason?: string;
};

const MAX_CANCELLATION_REASON_LENGTH = 2000;

function isIssuedInvoice(order: { invoiceId?: string; invoiceStatus?: string }): boolean {
  if (!order.invoiceId?.trim()) return false;
  if (order.invoiceStatus === "reversed") return false;
  const status = order.invoiceStatus || "pending";
  return status === "issued" || status === "manual";
}

function normalizeCancellationReason(reason?: string): string | undefined {
  const trimmed = String(reason || "").trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, MAX_CANCELLATION_REASON_LENGTH);
}

async function resolveStripePaymentIntentId(orderId: mongoose.Types.ObjectId): Promise<string | null> {
  const temp = await TempOrder.findOne({ finalizedOrderId: orderId }).lean();
  return temp?.stripePaymentIntentId?.trim() || null;
}

async function orderUsesStripePayment(order: InstanceType<typeof Order>): Promise<boolean> {
  const paymentIntentId = await resolveStripePaymentIntentId(order._id);
  if (paymentIntentId) return true;

  await order.populate("paymentMethod");
  const name = String((order.paymentMethod as { name?: string })?.name || "").toLowerCase();
  return name.includes("stripe");
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Függőben",
    processing: "Feldolgozás alatt",
    shipped: "Szállítva",
    delivered: "Kézbesítve",
    cancelled: "Törölve",
  };
  return labels[status] || status;
}

const CANCELLATION_EMAIL_TEMPLATE_TYPES = ["order_status_change", "order_cancelled"] as const;

async function ensureCancellationEmailTemplates() {
  const seeds = await buildCoreEmailTemplateSeeds();
  for (const type of CANCELLATION_EMAIL_TEMPLATE_TYPES) {
    const seed = seeds.find((entry) => entry.type === type);
    if (seed) {
      await EmailTemplateService.createMissing(type, seed);
    }
  }
}

async function buildReversalInvoiceAttachment(
  order: InstanceType<typeof Order>,
  reversalInvoiceId?: string
) {
  if (!reversalInvoiceId?.trim()) return undefined;

  const orderId = order._id.toString();
  const pdf = await InvoicingSzamlazzService.downloadInvoicePdf({
    invoiceId: reversalInvoiceId,
    orderNumber: formatOrderNumber(order._id),
    legacyOrderNumber: orderId,
  });
  if (!pdf) return undefined;

  return [
    {
      filename: `${reversalInvoiceId}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    },
  ];
}

async function notifyOrderCancelled(
  order: InstanceType<typeof Order>,
  oldStatus: string,
  cancellationReason?: string,
  reversalInvoiceId?: string
) {
  const customerEmail = (order as { user?: { email?: string } }).user?.email || order.billingInfo?.email;
  const customerName = (order as { user?: { name?: string } }).user?.name || order.shippingAddress?.name;
  const orderId = order._id.toString();
  const logBase = { flow: "order_cancellation_email", orderId };

  if (!customerEmail) {
    logMailer("warn", "cancellation_email_skipped", {
      ...logBase,
      reason: "no_customer_email",
    });
    return;
  }

  try {
    await ensureCancellationEmailTemplates();
  } catch (error) {
    logMailer("error", "cancellation_email_template_seed_failed", {
      ...logBase,
      error: error instanceof Error ? { message: error.message, name: error.name } : { message: String(error) },
    });
  }

  const emailData = {
    orderNumber: formatOrderNumber(order._id),
    customerName,
    oldStatus: getStatusLabel(oldStatus),
    newStatus: getStatusLabel(ADMIN_ORDER_DELETED_STATUS),
    cancellationReason,
    reversalInvoiceId,
  };

  try {
    await MailerService.sendEmail({
      to: customerEmail,
      templateType: "order_status_change",
      data: emailData,
      logContext: logBase,
    });
  } catch (error) {
    logMailer("error", "cancellation_status_email_failed", {
      ...logBase,
      templateType: "order_status_change",
      error: error instanceof Error ? { message: error.message, name: error.name } : { message: String(error) },
    });
  }

  try {
    const attachments = await buildReversalInvoiceAttachment(order, reversalInvoiceId);
    await MailerService.sendEmail({
      to: customerEmail,
      templateType: "order_cancelled",
      data: emailData,
      attachments,
      logContext: {
        ...logBase,
        reversalInvoiceId,
        attachmentCount: attachments?.length ?? 0,
      },
    });
  } catch (error) {
    logMailer("error", "cancellation_email_failed", {
      ...logBase,
      templateType: "order_cancelled",
      reversalInvoiceId,
      error: error instanceof Error ? { message: error.message, name: error.name } : { message: String(error) },
    });
  }
}

export class OrderCancellationService {
  static async cancel(orderId: string, options: CancelOrderOptions = {}): Promise<CancelOrderResult> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new Error("Érvénytelen rendelés azonosító");
    }

    const cancellationReason = normalizeCancellationReason(options.reason);

    const order = await Order.findById(orderId).populate("user");
    if (!order) throw new Error("A rendelés nem található");
    if (isAdminDeletedOrder(order.status)) {
      throw new Error("A rendelés már törölve van.");
    }

    const oldStatus = order.status;
    let refunded = false;
    let refundId: string | undefined;
    let invoiceReversed = false;
    let reversalInvoiceId: string | undefined;

    const stripeOrder = await orderUsesStripePayment(order);
    if (stripeOrder) {
      if (order.stripeRefundId) {
        refunded = true;
        refundId = order.stripeRefundId;
      } else {
        const paymentIntentId = await resolveStripePaymentIntentId(order._id);
        if (!paymentIntentId) {
          throw new Error("Stripe fizetés azonosító nem található ehhez a rendeléshez.");
        }

        const stripe = getStripeClient();
        const existing = await stripe.refunds.list({ payment_intent: paymentIntentId, limit: 1 });
        if (existing.data.length > 0) {
          refunded = true;
          refundId = existing.data[0].id;
        } else {
          const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });
          refunded = true;
          refundId = refund.id;
        }
        order.stripeRefundId = refundId;
      }
    }

    if (order.invoiceReversalId) {
      invoiceReversed = true;
      reversalInvoiceId = order.invoiceReversalId;
    } else if (isIssuedInvoice(order)) {
      const reversal = await InvoicingSzamlazzService.reverseInvoice(order.invoiceId!);
      invoiceReversed = true;
      reversalInvoiceId = reversal.invoiceId;
      order.invoiceReversalId = reversalInvoiceId;
      order.invoiceStatus = "reversed";
    }

    const tempOrder = await TempOrder.findOne({ finalizedOrderId: order._id }).lean();
    let stockRestored = false;
    if (tempOrder?._id) {
      const restoredLines = await releaseReservationsForTempOrder(tempOrder._id.toString(), {
        states: ["confirmed"],
      });
      stockRestored = restoredLines > 0;
    } else if (order.items.length > 0) {
      for (const item of order.items) {
        await restoreCheckoutLineStock({
          product: String(item.product),
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
      stockRestored = true;
    }

    recordOrderStatusChange(order, oldStatus, ADMIN_ORDER_DELETED_STATUS);
    order.cancelledAt = order.cancelledAt ?? new Date();
    order.cancellationReason = cancellationReason;
    await order.save();

    await notifyOrderCancelled(order, oldStatus, cancellationReason, reversalInvoiceId);

    return {
      success: true,
      refunded,
      refundId,
      invoiceReversed,
      reversalInvoiceId,
      stockRestored,
      cancellationReason,
    };
  }
}

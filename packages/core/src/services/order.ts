/* eslint-disable @typescript-eslint/no-explicit-any -- legacy order flow handles dynamic Mongoose and checkout payload shapes */
import dbConnect from "@wse/core/lib/db";
import Order from "@wse/core/models/Order";
import Product from "@wse/core/models/Product";
import Cart from "@wse/core/models/Cart";
import User from "@wse/core/models/User";
import mongoose from "mongoose";
import { logMailer } from "@wse/core/lib/mailer-log";
import { MailerService } from "./mailer";
import { FeatureFlagService } from "./feature-flags";
import { InvoicingSzamlazzService } from "./invoicing-szamlazz";
import { formatOrderNumber } from "@wse/core/lib/order-number";
import {
  decrementCheckoutLineStock,
  InventoryReservationError,
  restoreCheckoutLineStock,
  type CheckoutStockAllocation,
} from "@wse/core/services/inventory-reservation";
import { applyCheckoutPriceAllocations } from "@wse/core/services/checkout-validation";
import { recordCouponRedemptions } from "@wse/core/lib/coupon-usage";
import { sendInvoiceErrorShopAlert } from "@wse/core/services/invoice-error-alert";
import { sendNewOrderNotification } from "@wse/core/services/new-order-notification";
import { sendOrderPlacementErrorShopAlert } from "@wse/core/services/order-placement-error-alert";
import { resolvePublicAppBaseUrl } from "@wse/core/lib/app-base-url-server";
import { buildAuthLoginUrl, buildGuestOrderViewUrl } from "@wse/core/lib/order-guest-access";
import { OrderGuestAccessService } from "@wse/core/services/order-guest-access";

export type OrderWithGuestAccess = InstanceType<typeof Order> & { guestAccessToken?: string };

export class OrderService {
  static async createOrder(orderData: any, userId?: string) {
    return this.createOrderFromCheckoutData(orderData, userId, { enforceShopEnabled: true });
  }

  static async createOrderFromCheckoutData(
    orderData: any,
    userId?: string,
    options?: { enforceShopEnabled?: boolean; skipStockDecrement?: boolean }
  ) {
    let orderIdForAlert: string | undefined;
    let orderPersisted = false;

    try {
      if (options?.enforceShopEnabled !== false) {
        const isShopEnabled = await FeatureFlagService.isEnabled("shopPage", true);
        if (!isShopEnabled) {
          throw new Error("Jelenleg a rendelés leadás szünetel");
        }
      }
      await dbConnect();

      if (options?.skipStockDecrement) {
        await this.validateReservedStockStillCoversOrder(orderData);
      } else {
        const allocations = await this.validateAndUpdateStockTransactional(orderData);
        orderData = applyCheckoutPriceAllocations(orderData, allocations);
      }

      const {
        saveAddressToProfile,
        billingCountry: billingCountryRaw,
        shippingCountry: shippingCountryRaw,
        billingCountryCode,
        shippingCountryCode,
        paymentProvider,
        ...orderPayload
      } = orderData;
      void billingCountryCode;
      void shippingCountryCode;
      void paymentProvider;

      // 2. Create the order
      const order = new Order({
        ...orderPayload,
        user: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      });
      if (order?._id) {
        orderIdForAlert = String(order._id);
      }
      await order.save();
      orderPersisted = true;

      await recordCouponRedemptions(orderPayload.couponCodes, {
        userId,
        email: orderData.billingInfo?.email,
      });

      if (userId && saveAddressToProfile === true) {
        await this.persistUserAddressesFromCheckout(userId, orderData, {
          billingCountry: billingCountryRaw,
          shippingCountry: shippingCountryRaw,
        });
      }

      // 3. Clear the cart if user is logged in
      await this.clearUserCart(userId);

      let guestAccessToken: string | undefined;
      if (!userId) {
        const guestEmail = orderData.billingInfo?.email?.trim();
        if (guestEmail) {
          guestAccessToken = await OrderGuestAccessService.createForOrder(String(order._id), guestEmail);
        }
      }

      // 4. Trigger side effects after successful persistence
      await this.sendOrderConfirmation(order, orderData, guestAccessToken);
      await sendNewOrderNotification(order._id);
      await this.tryIssueInvoice(order);

      if (guestAccessToken) {
        (order as OrderWithGuestAccess).guestAccessToken = guestAccessToken;
      }

      return order as OrderWithGuestAccess;
    } catch (error) {
      await sendOrderPlacementErrorShopAlert({
        error,
        orderData,
        userId,
        orderId: orderIdForAlert,
        orderPersisted,
        checkoutOptions: {
          enforceShopEnabled: options?.enforceShopEnabled,
          skipStockDecrement: options?.skipStockDecrement,
        },
      });
      throw error;
    }
  }

  /** After Stripe inventory hold: DB stock was already lowered atomically; only verify the reserved lines still map to orderable products/variants. */
  private static async validateReservedStockStillCoversOrder(orderData: any) {
    for (const item of orderData.items) {
      const product = await Product.findById(item.product).lean();
      if (!product) throw new Error(`Product ${item.product} not found`);
      if (!product.isActive || !product.isVisible) throw new Error(`${product.name} is no longer available`);
      const hasVariants = Array.isArray((product as any).variants) && (product as any).variants.length > 0;
      const requireVariantSelection = Boolean((product as any).requireVariantSelection) && hasVariants;

      if (item.variantId) {
        if (!hasVariants) throw new Error(`Érvénytelen variáns a termékhez: ${product.name}`);
        const variant = (product as any).variants.find((v: any) => v.id === item.variantId);
        if (!variant) throw new Error(`Érvénytelen variáns: ${product.name}`);
        if (variant.isActive === false) {
          throw new Error(`A kiválasztott variáns már nem elérhető: ${product.name}`);
        }
      } else if (requireVariantSelection) {
        if (!item.variantId) throw new Error(`Válassz variánst a termékhez: ${product.name}`);
      }
    }
  }

  /** Per-line atomic decrement for non-Stripe checkout (no reservation rows; standalone-Mongo safe). */
  private static async validateAndUpdateStockTransactional(orderData: any): Promise<CheckoutStockAllocation[]> {
    const applied: { product: string; variantId?: string; quantity: number; promoQuantity?: number }[] = [];
    const allocations: CheckoutStockAllocation[] = [];
    try {
      for (const item of orderData.items) {
        const line = {
          product: String(item.product),
          variantId: item.variantId,
          quantity: item.quantity,
          promoCounter: "sold" as const,
        };
        const allocation = await decrementCheckoutLineStock(undefined, line);
        allocations.push(allocation);
        applied.push({ ...line, promoQuantity: allocation.promoQuantity });
      }
      return allocations;
    } catch (e: any) {
      for (const line of applied.reverse()) {
        try {
          await restoreCheckoutLineStock({ ...line, promoCounter: "sold" });
        } catch {
          /* best-effort rollback */
        }
      }
      if (e instanceof InventoryReservationError) throw new Error(e.message);
      throw e instanceof Error ? e : new Error(String(e));
    }
  }

  private static async persistUserAddressesFromCheckout(
    userId: string,
    orderData: any,
    extras: { billingCountry?: string; shippingCountry?: string }
  ) {
    try {
      const bi = orderData.billingInfo;
      const ship = orderData.shippingAddress;
      if (!bi?.name || !ship?.name) return;

      const billingCountry = extras.billingCountry?.trim() || "Magyarország";
      const shippingCountry = extras.shippingCountry?.trim() || billingCountry;

      await User.findByIdAndUpdate(userId, {
        $set: {
          billingInfo: {
            type: bi.type === "company" ? "company" : "personal",
            name: bi.name,
            taxNumber: bi.taxNumber,
            country: billingCountry,
            city: bi.city,
            zip: bi.zip,
            street: bi.street,
            email: bi.email,
            phone: bi.phone,
          },
          shippingAddress: {
            name: ship.name,
            country: shippingCountry,
            city: ship.city,
            zip: ship.zip,
            street: ship.street,
            comment: ship.comment,
            email: ship.email,
            phone: ship.phone,
          },
        },
      });
    } catch (err) {
      console.error("Failed to persist checkout addresses to user profile:", err);
    }
  }

  private static async clearUserCart(userId?: string) {
    if (userId) {
      await Cart.findOneAndUpdate(
        { user: new mongoose.Types.ObjectId(userId) },
        { items: [] }
      );
    }
  }

  private static async sendOrderConfirmation(
    order: any,
    orderData: any,
    guestAccessToken?: string
  ) {
    const orderId = String(order._id);
    const logBase = { flow: "order_confirmation", orderId };

    try {
      const populatedOrder = await Order.findById(order._id).populate("user");
      const userEmail = populatedOrder?.user?.email;
      const billingEmail = orderData.billingInfo?.email;
      const customerEmail = userEmail || billingEmail;
      const emailSource = userEmail ? "user" : billingEmail ? "billingInfo" : "none";
      const customerName = populatedOrder?.user?.name || orderData.shippingAddress?.name;
      const isGuestOrder = !populatedOrder?.user && Boolean(guestAccessToken);
      const publicBaseUrl = await resolvePublicAppBaseUrl();
      const orderViewUrl = guestAccessToken
        ? buildGuestOrderViewUrl(orderId, guestAccessToken, publicBaseUrl)
        : undefined;
      const linkToAccountUrl = guestAccessToken && orderViewUrl
        ? buildAuthLoginUrl(orderViewUrl, publicBaseUrl)
        : undefined;

      if (!customerEmail) {
        logMailer("warn", "order_confirmation_skipped", {
          ...logBase,
          reason: "no_customer_email",
          hadUser: Boolean(populatedOrder?.user),
        });
        return;
      }

      logMailer("info", "order_confirmation_attempt", {
        ...logBase,
        emailSource,
        templateType: "order_confirmation",
      });

      await MailerService.sendEmail({
        to: customerEmail,
        templateType: "order_confirmation",
        logContext: logBase,
        data: {
          orderNumber: formatOrderNumber(order._id),
          customerName,
          totalAmount: order.total.toLocaleString("hu-HU"),
          shippingAddress: `${order.shippingAddress.zip} ${order.shippingAddress.city}, ${order.shippingAddress.street}`,
          items: order.items
            .map((i: any) => `${i.name}${i.variantLabel ? ` [${i.variantLabel}]` : ""} (${i.quantity}x)`)
            .join(", "),
          orderViewUrl: orderViewUrl || "",
          linkToAccountUrl: linkToAccountUrl || "",
          isGuestOrder,
        },
      });

      logMailer("info", "order_confirmation_sent", logBase);
    } catch (emailError) {
      logMailer("error", "order_confirmation_failed", {
        ...logBase,
        note: "Order was already saved; only email delivery failed.",
        error:
          emailError instanceof Error
            ? { message: emailError.message, name: emailError.name }
            : { message: String(emailError) },
      });
    }
  }

  private static async tryIssueInvoice(_order: any) {
    const order = _order as any;
    const orderId = String(order._id);
    const logBase = { flow: "szamlazz_invoice", orderId };

    try {
      const invoicingEnabled = await FeatureFlagService.isEnabled("szamlazzInvoicing", false);
      if (!invoicingEnabled) {
        logMailer("info", "invoice_issue_skipped", {
          ...logBase,
          reason: "szamlazzInvoicing_flag_off",
        });
        return;
      }

      logMailer("info", "invoice_issue_attempt", logBase);

      order.invoiceMode = "automatic";
      order.invoiceStatus = "pending";
      await order.save();

      await order.populate("paymentMethod");
      const result = await InvoicingSzamlazzService.issueInvoice(order);
      order.invoiceId = result.invoiceId;
      order.invoiceStatus = "issued";
      order.invoiceIssuedAt = new Date();
      order.invoiceLastError = undefined;
      if (result.pdfFileName) {
        order.invoicePdfFileName = result.pdfFileName;
      }
      await order.save();

      logMailer("info", "invoice_issue_success", {
        ...logBase,
        invoiceId: result.invoiceId,
      });
      await this.sendInvoiceEmail(order, "invoice_sent", "A számla csatolmányban elérhető.");
    } catch (error: any) {
      const errMessage = error?.message || "Ismeretlen számlázási hiba";
      order.invoiceStatus = "failed";
      order.invoiceLastError = errMessage;
      await order.save();

      logMailer("warn", "invoice_issue_failed", {
        ...logBase,
        errorMessage: errMessage,
        nextSteps: "customer_invoice_issue_email_and_shop_alert",
      });

      logMailer("info", "invoice_issue_customer_notice_attempt", {
        ...logBase,
        templateType: "invoice_issue",
      });
      await this.sendInvoiceEmail(
        order,
        "invoice_issue",
        "A számla automatikus kiállítása nem sikerült. Hamarosan manuálisan küldjük."
      );

      await sendInvoiceErrorShopAlert(order._id, error);
    }
  }

  static async sendInvoiceEmail(orderInput: any, templateType: "invoice_sent" | "invoice_issue", message: string) {
    try {
      const order = await Order.findById(orderInput._id).populate("user");
      if (!order) return;
      const orderIdRaw = order._id || orderInput._id;
      if (!orderIdRaw) return;
      const orderId = String(orderIdRaw);

      const customerEmail = (order as any).user?.email || order.billingInfo?.email;
      const customerName = (order as any).user?.name || order.shippingAddress?.name;
      const logBase = { flow: "invoice_email", orderId, templateType };
      if (!customerEmail) {
        logMailer("warn", "invoice_email_skipped", {
          ...logBase,
          reason: "no_customer_email",
        });
        return;
      }

      let attachments: { filename: string; content: Buffer; contentType?: string }[] | undefined;
      if (templateType === "invoice_sent") {
        const invoicePdf = await InvoicingSzamlazzService.downloadInvoicePdf({
          invoiceId: order.invoiceId,
          orderNumber: formatOrderNumber(orderId),
          legacyOrderNumber: orderId,
          fallbackFileName: order.invoicePdfFileName,
        });
        if (invoicePdf) {
          attachments = [
            {
              filename: `${order.invoiceId || `invoice-${formatOrderNumber(orderId)}`}.pdf`,
              content: invoicePdf,
              contentType: "application/pdf",
            },
          ];
        }
      }

      await MailerService.sendEmail({
        to: customerEmail,
        templateType,
        logContext: logBase,
        data: {
          customerName,
          orderNumber: formatOrderNumber(orderId),
          invoiceId: order.invoiceId || "",
          invoiceMessage: message,
        },
        attachments,
      });

      order.invoiceEmailSentAt = new Date();
      if (typeof (order as any).save === "function") {
        await order.save();
      }
    } catch (error) {
      logMailer("error", "invoice_email_failed", {
        flow: "invoice_email",
        orderId: String(orderInput._id || ""),
        templateType,
        error:
          error instanceof Error
            ? { message: error.message, name: error.name }
            : { message: String(error) },
      });
    }
  }
}

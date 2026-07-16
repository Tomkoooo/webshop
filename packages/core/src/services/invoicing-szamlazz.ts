import {
  Buyer,
  Client,
  Currencies,
  Invoice,
  Item,
  Languages,
  PaymentMethods,
  Seller,
} from "szamlazz.js";
import { IOrder } from "@wse/core/models/Order";
import { loadInvoicePdf, persistInvoicePdf } from "@wse/core/lib/invoice-pdf-storage";
import { formatOrderNumber } from "@wse/core/lib/order-number";
import { highestCartVatPercent } from "@wse/core/lib/pricing";

type InvoiceIssueResult = {
  invoiceId: string;
  pdfFileName?: string;
  netTotal?: string;
  grossTotal?: string;
};

export type InvoiceLineDescriptor = {
  label: string;
  quantity: number;
  unit: string;
  vat: number;
  grossUnitPrice: number;
};

/** Pure line list for Számlázz (testable without API client). */
export function describeInvoiceLines(order: Pick<IOrder, "items" | "shippingFee" | "paymentFee">): InvoiceLineDescriptor[] {
  const feeVat = highestCartVatPercent(order.items);
  const productLines: InvoiceLineDescriptor[] = order.items.map((line) => {
    const quantity = parseNumber(line.quantity) || 1;
    const grossUnitPrice = parseNumber(line.price);
    const vat = Math.round(parseNumber(line.vatPercent ?? 27));
    return {
      label: line.variantLabel ? `${line.name} [${line.variantLabel}]` : line.name,
      quantity,
      unit: "db",
      vat,
      grossUnitPrice,
    };
  });
  const feeLines: InvoiceLineDescriptor[] = [];
  const shippingFee = parseNumber(order.shippingFee);
  if (shippingFee > 0) {
    feeLines.push({
      label: "Szállítás",
      quantity: 1,
      unit: "db",
      vat: feeVat,
      grossUnitPrice: shippingFee,
    });
  }
  const paymentFee = parseNumber(order.paymentFee);
  if (paymentFee > 0) {
    feeLines.push({
      label: "Fizetési kezelési díj",
      quantity: 1,
      unit: "db",
      vat: feeVat,
      grossUnitPrice: paymentFee,
    });
  }
  return [...productLines, ...feeLines];
}

export function invoiceDownloadParamsForOrder(order: {
  _id: unknown;
  invoiceId?: string;
  invoicePdfFileName?: string;
}) {
  const legacyOrderNumber = String(order._id);
  return {
    invoiceId: order.invoiceId,
    orderNumber: formatOrderNumber(order._id),
    legacyOrderNumber,
    fallbackFileName: order.invoicePdfFileName,
  };
}

function parseNumber(input: unknown): number {
  const n = Number(input ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** Currencies supported by our Számlázz.hu integration (see szamlazz.js `Currencies`). */
export type SzamlazzInvoiceCurrency = "HUF" | "EUR";

export function resolveSzamlazzCurrency(code: string | null | undefined): SzamlazzInvoiceCurrency {
  const normalized = String(code ?? "HUF")
    .trim()
    .toUpperCase();
  return normalized === "EUR" ? "EUR" : "HUF";
}

function szamlazzCurrencyObject(code: SzamlazzInvoiceCurrency) {
  return code === "EUR" ? Currencies.EUR : Currencies.HUF;
}

function szamlazzLanguage(code: SzamlazzInvoiceCurrency) {
  return code === "EUR" ? Languages.English : Languages.Hungarian;
}

function mapPaymentMethod(order: IOrder) {
  const paymentName = String((order as unknown as { paymentMethod?: { name?: string } }).paymentMethod?.name || "").toLowerCase();
  if (paymentName.includes("kárty") || paymentName.includes("card") || paymentName.includes("stripe")) {
    return PaymentMethods.CreditCard;
  }
  return PaymentMethods.BankTransfer;
}

export type SzamlazzCredentialOverride = {
  agentKey?: string
  sellerName?: string
  sellerBank?: string
  sellerBankAccount?: string
}

export class InvoicingSzamlazzService {
  private static getClient(
    requestInvoiceDownload: boolean = true,
    override?: SzamlazzCredentialOverride
  ) {
    const authToken = override?.agentKey?.trim() || process.env.SZAMLAZZ_AGENT_KEY;
    const user = process.env.SZAMLAZZ_USER;
    const password = process.env.SZAMLAZZ_PASSWORD;

    if (!authToken && (!user || !password)) {
      throw new Error("Számlázz credentials are missing. Set SZAMLAZZ_AGENT_KEY or SZAMLAZZ_USER/SZAMLAZZ_PASSWORD.");
    }

    return new Client({
      authToken,
      user: authToken ? undefined : user,
      password: authToken ? undefined : password,
      eInvoice: true,
      requestInvoiceDownload,
      downloadedInvoiceCount: 1,
      responseVersion: 1,
      timeout: parseNumber(process.env.SZAMLAZZ_TIMEOUT_MS || 10000),
    });
  }

  private static buildSeller(override?: SzamlazzCredentialOverride) {
    return new Seller({
      bank: {
        name: override?.sellerBank || process.env.SZAMLAZZ_SELLER_BANK_NAME || "",
        accountNumber: override?.sellerBankAccount || process.env.SZAMLAZZ_SELLER_BANK_ACCOUNT || "",
      },
      issuerName: override?.sellerName || process.env.SZAMLAZZ_ISSUER_NAME || "",
      email: {
        replyToAddress: process.env.EMAIL_FROM || "",
        subject: process.env.SZAMLAZZ_EMAIL_SUBJECT || "Számla",
        message: process.env.SZAMLAZZ_EMAIL_MESSAGE || "",
      },
    });
  }

  private static buildBuyer(order: IOrder) {
    return new Buyer({
      name: order.billingInfo.name,
      country: order.billingInfo.countryCode || "HU",
      zip: order.billingInfo.zip,
      city: order.billingInfo.city,
      address: order.billingInfo.street,
      taxNumber: order.billingInfo.taxNumber || "",
      phone: order.billingInfo.phone || "",
    });
  }

  private static buildItems(order: IOrder) {
    return describeInvoiceLines(order).map(
      (line) =>
        new Item({
          label: line.label,
          quantity: line.quantity,
          unit: line.unit,
          vat: line.vat,
          grossUnitPrice: line.grossUnitPrice,
        })
    );
  }

  /** Persist invoice PDF in Mongo (same as admin/media uploads — no local disk). */
  private static async savePdfBuffer(pdfBuffer: Buffer, orderId: string): Promise<string> {
    return persistInvoicePdf(pdfBuffer, orderId);
  }

  static async issueInvoice(
    order: IOrder,
    opts?: { currency?: string | null; credentials?: SzamlazzCredentialOverride }
  ): Promise<InvoiceIssueResult> {
    const currencyCode = resolveSzamlazzCurrency(opts?.currency);
    const client = this.getClient(true, opts?.credentials);
    const invoice = new Invoice({
      paymentMethod: mapPaymentMethod(order),
      currency: szamlazzCurrencyObject(currencyCode),
      language: szamlazzLanguage(currencyCode),
      seller: this.buildSeller(opts?.credentials),
      buyer: this.buildBuyer(order),
      items: this.buildItems(order),
      orderNumber: formatOrderNumber(order._id),
    });

    const response = await client.issueInvoice(invoice);
    const invoiceId = String(response.invoiceId || "");
    if (!invoiceId) {
      throw new Error("Számlázás sikertelen: hiányzó invoice azonosító.");
    }

    let pdfFileName: string | undefined;
    const maybePdf = (response as unknown as { pdf?: Buffer }).pdf;
    if (maybePdf && Buffer.isBuffer(maybePdf)) {
      pdfFileName = await this.savePdfBuffer(maybePdf, order._id.toString());
    }

    return {
      invoiceId,
      pdfFileName,
      netTotal: String((response as unknown as { netTotal?: string }).netTotal || ""),
      grossTotal: String((response as unknown as { grossTotal?: string }).grossTotal || ""),
    };
  }

  private static async fetchPdfFromProvider(
    client: ReturnType<typeof InvoicingSzamlazzService.getClient>,
    params: { invoiceId?: string; orderNumber?: string }
  ): Promise<Buffer | null> {
    try {
      const result = await client.getInvoiceData({
        invoiceId: params.invoiceId,
        orderNumber: params.orderNumber,
        pdf: true,
      });
      const maybePdf = (result as unknown as { pdf?: Buffer }).pdf;
      if (maybePdf && Buffer.isBuffer(maybePdf)) {
        return maybePdf;
      }
    } catch {
      // Try alternate order number or fallback below.
    }
    return null;
  }

  static async reverseInvoice(invoiceId: string): Promise<{ invoiceId: string }> {
    const trimmed = invoiceId.trim();
    if (!trimmed) {
      throw new Error("Számla sztornózás sikertelen: hiányzó számlaszám.");
    }

    const client = this.getClient(false);
    const response = await client.reverseInvoice({
      invoiceId: trimmed,
      eInvoice: true,
      requestInvoiceDownload: false,
    });
    const reversalId = String((response as { invoiceId?: string }).invoiceId || "");
    if (!reversalId) {
      throw new Error("Számla sztornózás sikertelen: hiányzó sztornó számla azonosító.");
    }
    return { invoiceId: reversalId };
  }

  static async downloadInvoicePdf(params: {
    invoiceId?: string;
    orderNumber?: string;
    /** Full MongoDB id for invoices issued before short order numbers. */
    legacyOrderNumber?: string;
    fallbackFileName?: string;
  }) {
    const client = this.getClient(false);
    const orderNumbers = [
      params.orderNumber,
      params.legacyOrderNumber &&
      params.legacyOrderNumber !== params.orderNumber
        ? params.legacyOrderNumber
        : undefined,
    ].filter((n): n is string => Boolean(n?.trim()));

    for (const orderNumber of orderNumbers) {
      const pdf = await this.fetchPdfFromProvider(client, {
        invoiceId: params.invoiceId,
        orderNumber,
      });
      if (pdf) return pdf;
    }

    if (params.fallbackFileName) {
      const fromDb = await loadInvoicePdf(params.fallbackFileName);
      if (fromDb) return fromDb;
    }

    return null;
  }
}

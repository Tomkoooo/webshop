import { beforeEach, describe, expect, it, vi } from "vitest"

const loadInvoicePdfMock = vi.fn()

vi.mock("@wse/core/lib/invoice-pdf-storage", () => ({
  loadInvoicePdf: (...args: unknown[]) => loadInvoicePdfMock(...args),
  persistInvoicePdf: vi.fn(),
}))

const clientCtorOpts: { authToken?: string }[] = []
const getInvoiceDataMock = vi.fn()

vi.mock("szamlazz.js", () => ({
  Buyer: class {},
  Client: class {
    getInvoiceData = (...args: unknown[]) => getInvoiceDataMock(...args)
    reverseInvoice = vi.fn()
    issueInvoice = vi.fn()
    constructor(opts: { authToken?: string }) {
      clientCtorOpts.push(opts)
    }
  },
  Currencies: { HUF: "HUF", EUR: "EUR" },
  Invoice: class {},
  Item: class {},
  Languages: { Hungarian: "hu", English: "en" },
  PaymentMethods: { CreditCard: "card", BankTransfer: "transfer" },
  Seller: class {},
}))

describe("InvoicingSzamlazzService multi-tenant credentials", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clientCtorOpts.length = 0
    delete process.env.SZAMLAZZ_AGENT_KEY
    delete process.env.SZAMLAZZ_USER
    delete process.env.SZAMLAZZ_PASSWORD
  })

  it("returns stored PDF without platform env (invoice email path)", async () => {
    loadInvoicePdfMock.mockResolvedValue(Buffer.from("%PDF-stored"))

    const { InvoicingSzamlazzService } = await import("@wse/core/services/invoicing-szamlazz")
    const pdf = await InvoicingSzamlazzService.downloadInvoicePdf({
      invoiceId: "INV-1",
      fallbackFileName: "stored-invoice.pdf",
    })

    expect(pdf?.toString()).toBe("%PDF-stored")
    expect(loadInvoicePdfMock).toHaveBeenCalledWith("stored-invoice.pdf")
    expect(clientCtorOpts).toHaveLength(0)
  })

  it("uses org agentKey override when downloading and does not require env", async () => {
    loadInvoicePdfMock.mockResolvedValue(null)
    getInvoiceDataMock.mockResolvedValue({ pdf: Buffer.from("%PDF-remote") })

    const { InvoicingSzamlazzService } = await import("@wse/core/services/invoicing-szamlazz")
    const agentKey = "qt67x8y8eirt6f8e2s82egdkt9hj7r7iw65dz38zm3"
    const pdf = await InvoicingSzamlazzService.downloadInvoicePdf({
      invoiceId: "INV-2",
      legacyOrderNumber: "booking-id",
      credentials: { agentKey },
    })

    expect(clientCtorOpts[0]?.authToken).toBe(agentKey)
    expect(pdf?.toString()).toBe("%PDF-remote")
  })

  it("throws a clear error when neither org nor platform credentials exist", async () => {
    loadInvoicePdfMock.mockResolvedValue(null)
    const { InvoicingSzamlazzService } = await import("@wse/core/services/invoicing-szamlazz")

    await expect(
      InvoicingSzamlazzService.downloadInvoicePdf({
        invoiceId: "INV-3",
        legacyOrderNumber: "booking-id",
      })
    ).rejects.toThrow(/organization agent key|SZAMLAZZ_AGENT_KEY/)
  })
})

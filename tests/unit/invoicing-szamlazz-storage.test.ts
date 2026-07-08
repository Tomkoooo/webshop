import { beforeEach, describe, expect, it, vi } from "vitest";

const processUploadMock = vi.fn();
const incrementUsageMock = vi.fn();
const getFilePayloadMock = vi.fn();

vi.mock("@wse/core/services/media", () => ({
  MediaService: {
    processUpload: (...args: unknown[]) => processUploadMock(...args),
    incrementUsage: (...args: unknown[]) => incrementUsageMock(...args),
    getFilePayload: (...args: unknown[]) => getFilePayloadMock(...args),
  },
}));

describe("invoice PDF storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    processUploadMock.mockResolvedValue("abc-123.pdf");
    incrementUsageMock.mockResolvedValue(undefined);
  });

  it("persists PDF via MediaService without touching disk", async () => {
    const { persistInvoicePdf } = await import("@wse/core/lib/invoice-pdf-storage");
    const pdf = Buffer.from("%PDF-test");

    const filename = await persistInvoicePdf(pdf, "507f1f77bcf86cd799439011");

    expect(filename).toBe("abc-123.pdf");
    expect(processUploadMock).toHaveBeenCalledWith(
      pdf,
      "invoice-507f1f77bcf86cd799439011.pdf",
      "application/pdf"
    );
    expect(incrementUsageMock).toHaveBeenCalledWith("abc-123.pdf");
  });

  it("loads stored PDF from MediaService", async () => {
    getFilePayloadMock.mockResolvedValue({
      buffer: Buffer.from("%PDF-fallback"),
      mimeType: "application/pdf",
      size: 14,
    });

    const { loadInvoicePdf } = await import("@wse/core/lib/invoice-pdf-storage");
    const buf = await loadInvoicePdf("stored.pdf");

    expect(getFilePayloadMock).toHaveBeenCalledWith("stored.pdf");
    expect(buf?.toString()).toBe("%PDF-fallback");
  });
});

import { MediaService } from "@wse/core/services/media"

/** Store invoice PDF bytes in Mongo (Vercel-safe; same pipeline as admin uploads). */
export async function persistInvoicePdf(pdfBuffer: Buffer, orderId: string): Promise<string> {
  const originalName = `invoice-${orderId}.pdf`
  const filename = await MediaService.processUpload(pdfBuffer, originalName, "application/pdf")
  await MediaService.incrementUsage(filename)
  return filename
}

export async function loadInvoicePdf(filename: string): Promise<Buffer | null> {
  const stored = await MediaService.getFilePayload(filename)
  return stored?.buffer ?? null
}

import "server-only"

import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import QRCode from "qrcode"
import { MediaService } from "@wse/core/services/media"
import { getAppBaseUrl } from "@wse/core/services/stripe"
import type { TBookAttendeeFieldDef } from "./attendee-fields"
import { formatAttendeeFieldValue } from "./attendee-fields"
import { formatEventSchedule } from "./event-schedule"
import {
  normalizeVoucherPdfLayout,
  type VoucherPdfLayout,
} from "./voucher-pdf-layout"

const ROBOTO_FONT_URL =
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf"

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 48
const HEADER_HEIGHT = 120

function hexToRgb(hex: string) {
  const cleaned = hex.replace("#", "").trim()
  if (cleaned.length !== 6) return rgb(0.1, 0.1, 0.1)
  const n = Number.parseInt(cleaned, 16)
  if (!Number.isFinite(n)) return rgb(0.1, 0.1, 0.1)
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

let cachedFontBytes: ArrayBuffer | null = null

async function loadRobotoFont(): Promise<ArrayBuffer> {
  if (cachedFontBytes) return cachedFontBytes
  const response = await fetch(ROBOTO_FONT_URL)
  if (!response.ok) throw new Error("A jegy betűtípus betöltése sikertelen.")
  cachedFontBytes = await response.arrayBuffer()
  return cachedFontBytes
}

function wrapText(text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines: string[] = []
  let current = words[0]
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`
    if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
      current = next
    } else {
      lines.push(current)
      current = words[i]
    }
  }
  lines.push(current)
  return lines
}

function drawLines(
  page: PDFPage,
  font: PDFFont,
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  lineHeight: number,
  color = rgb(0.1, 0.1, 0.1)
): number {
  let cursorY = y
  for (const line of lines) {
    page.drawText(line, { x, y: cursorY, size: fontSize, font, color })
    cursorY -= lineHeight
  }
  return cursorY
}

async function resolveHeaderImageBytes(headerImage: string): Promise<Uint8Array | null> {
  const trimmed = headerImage.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const res = await fetch(trimmed)
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  }

  const filename = trimmed.replace(/^\/api\/media\//, "")
  const payload = await MediaService.getFilePayload(filename)
  return payload?.buffer ? new Uint8Array(payload.buffer) : null
}

function formatEventDateRange(
  startDate: Date,
  endDate: Date,
  startTime?: string | null,
  endTime?: string | null
): string {
  return formatEventSchedule(startDate, endDate, startTime, endTime)
}

export type VoucherPdfPageInput = {
  token: string
  displayName: string
  attendeeFields: Record<string, string | number>
  attendeeFieldSchema: TBookAttendeeFieldDef[]
  eventName: string
  startDate: Date
  endDate: Date
  startTime?: string | null
  endTime?: string | null
  locationAddress: string
  bookingId: string
  pageIndex: number
  pageCount: number
}

export type BuildVoucherPdfInput = {
  headerImage: string
  pages: VoucherPdfPageInput[]
  layout?: VoucherPdfLayout | null
}

async function embedHeaderImage(
  pdf: PDFDocument,
  page: PDFPage,
  headerImage: string,
  font: PDFFont,
  margin: number,
  headerHeight: number
): Promise<number> {
  const contentWidth = page.getWidth() - margin * 2
  let y = page.getHeight() - margin

  const imageBytes = await resolveHeaderImageBytes(headerImage)
  if (imageBytes) {
    try {
      const isPng = headerImage.toLowerCase().includes(".png") || imageBytes[0] === 0x89
      const embedded = isPng ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes)
      const scale = Math.min(contentWidth / embedded.width, headerHeight / embedded.height)
      const w = embedded.width * scale
      const h = embedded.height * scale
      page.drawImage(embedded, {
        x: margin + (contentWidth - w) / 2,
        y: y - h,
        width: w,
        height: h,
      })
      y -= h + 16
    } catch {
      y = drawLines(page, font, [""], margin, y, 10, 12)
    }
  }

  return y
}

async function drawVoucherPage(
  pdf: PDFDocument,
  font: PDFFont,
  input: VoucherPdfPageInput,
  headerImage: string,
  layout: VoucherPdfLayout
): Promise<void> {
  const margin = layout.margin || MARGIN
  const page = pdf.addPage([A4_WIDTH, A4_HEIGHT])
  const contentWidth = page.getWidth() - margin * 2
  const primary = hexToRgb(layout.primaryColor || "#111827")
  const bodySize = layout.bodyFontSize || 11
  const titleSize = layout.titleFontSize || 20
  let y = page.getHeight() - margin

  const enabled = (type: string) =>
    layout.blocks.find((b) => b.type === type && b.enabled !== false)

  if (enabled("headerImage")) {
    y = await embedHeaderImage(
      pdf,
      page,
      headerImage,
      font,
      margin,
      layout.headerHeight || HEADER_HEIGHT
    )
  }

  if (enabled("title")) {
    const block = enabled("title")!
    const size = block.fontSize || titleSize
    y = drawLines(
      page,
      font,
      wrapText(input.eventName, font, size, contentWidth),
      margin,
      y,
      size,
      size + 4,
      block.color ? hexToRgb(block.color) : primary
    )
    y -= 8
  }

  if (enabled("eventSchedule")) {
    const block = enabled("eventSchedule")!
    const size = block.fontSize || bodySize
    y = drawLines(
      page,
      font,
      wrapText(
        formatEventDateRange(input.startDate, input.endDate, input.startTime, input.endTime),
        font,
        size,
        contentWidth
      ),
      margin,
      y,
      size,
      size + 3,
      rgb(0.3, 0.3, 0.3)
    )
  }

  if (enabled("location") && input.locationAddress) {
    const block = enabled("location")!
    const size = block.fontSize || bodySize
    y = drawLines(
      page,
      font,
      wrapText(input.locationAddress, font, size, contentWidth),
      margin,
      y,
      size,
      size + 3,
      rgb(0.3, 0.3, 0.3)
    )
  }

  y -= 12
  page.drawLine({
    start: { x: margin, y },
    end: { x: page.getWidth() - margin, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  })
  y -= 20

  if (enabled("subtitle")) {
    y = drawLines(page, font, ["Résztvevő"], margin, y, 10, 12, rgb(0.45, 0.45, 0.45))
    y = drawLines(
      page,
      font,
      wrapText(input.displayName, font, 16, contentWidth),
      margin,
      y,
      16,
      20
    )
  } else {
    // Keep participant name visible even if subtitle block was never added historically
    y = drawLines(page, font, ["Résztvevő"], margin, y, 10, 12, rgb(0.45, 0.45, 0.45))
    y = drawLines(
      page,
      font,
      wrapText(input.displayName, font, 16, contentWidth),
      margin,
      y,
      16,
      20
    )
  }

  if (enabled("attendeeFields")) {
    for (const field of input.attendeeFieldSchema) {
      const value = input.attendeeFields[field.key]
      if (value == null || value === "") continue
      const formatted = formatAttendeeFieldValue(field, value)
      if (formatted === "—") continue
      y = drawLines(
        page,
        font,
        wrapText(`${field.label}: ${formatted}`, font, 10, contentWidth),
        margin,
        y,
        10,
        13,
        rgb(0.35, 0.35, 0.35)
      )
    }
  }

  for (const block of layout.blocks.filter((b) => b.type === "customText" && b.enabled !== false)) {
    if (!block.text?.trim()) continue
    const size = block.fontSize || bodySize
    y -= 8
    y = drawLines(
      page,
      font,
      wrapText(block.text, font, size, contentWidth),
      margin,
      y,
      size,
      size + 3,
      block.color ? hexToRgb(block.color) : rgb(0.25, 0.25, 0.25)
    )
  }

  y -= 16

  if (enabled("qrCode")) {
    const qrSize = 160
    const qrPng = await QRCode.toBuffer(input.token, {
      type: "png",
      width: 400,
      margin: 1,
      errorCorrectionLevel: "M",
    })
    const qrImage = await pdf.embedPng(qrPng)
    page.drawImage(qrImage, {
      x: (page.getWidth() - qrSize) / 2,
      y: y - qrSize,
      width: qrSize,
      height: qrSize,
    })
    y -= qrSize + 12
  }

  if (enabled("footer") || layout.showPageNumbers) {
    const shortToken = input.token.slice(0, 8).toUpperCase()
    const footerLines = [
      `Entry code: ${shortToken}`,
      `Foglalás: ${input.bookingId.slice(-8).toUpperCase()}`,
    ]
    if (layout.showPageNumbers) {
      footerLines.push(`${input.pageIndex}/${input.pageCount}`)
    }
    const customFooter = enabled("footer")?.text?.trim()
    if (customFooter) footerLines.push(customFooter)
    else footerLines.push("Mutassa be ezt a QR-kódot a beléptetésnél.")

    drawLines(
      page,
      font,
      footerLines,
      margin,
      margin + 36,
      enabled("footer")?.fontSize || 9,
      12,
      rgb(0.5, 0.5, 0.5)
    )
  }
}

/** Build a multi-page voucher PDF — one page per guest. */
export async function buildVoucherPdf(input: BuildVoucherPdfInput): Promise<Uint8Array> {
  const fontBytes = await loadRobotoFont()
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes)
  const layout = normalizeVoucherPdfLayout(input.layout)

  // Ensure subtitle (participant name) exists in older layouts
  if (!layout.blocks.some((b) => b.type === "subtitle")) {
    const titleIdx = layout.blocks.findIndex((b) => b.type === "title")
    layout.blocks.splice(titleIdx + 1, 0, {
      id: "subtitle",
      type: "subtitle",
      enabled: true,
    })
  }

  const pageCount = input.pages.length
  for (let i = 0; i < pageCount; i += 1) {
    await drawVoucherPage(
      pdf,
      font,
      { ...input.pages[i], pageIndex: i + 1, pageCount },
      input.headerImage,
      layout
    )
  }

  return pdf.save()
}

/** Parse QR payload — accepts raw token or URL containing token. */
export function parseVoucherTokenFromScan(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ""

  try {
    const url = new URL(trimmed)
    const fromPath = url.pathname.split("/").filter(Boolean).pop()
    if (fromPath && /^[0-9a-f-]{36}$/i.test(fromPath)) return fromPath
    const fromQuery = url.searchParams.get("token")
    if (fromQuery) return fromQuery.trim()
  } catch {
    // not a URL
  }

  return trimmed
}

export function voucherValidationUrl(token: string): string {
  const base = getAppBaseUrl().replace(/\/$/, "")
  return `${base}/api/plugins/t-book/vouchers/${token}`
}

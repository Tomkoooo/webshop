import "server-only"

import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import QRCode from "qrcode"
import { MediaService } from "@wse/core/services/media"
import { getAppBaseUrl } from "@wse/core/services/stripe"
import type { TBookAttendeeFieldDef } from "./attendee-fields"
import { formatAttendeeFieldValue } from "./attendee-fields"
import { formatEventSchedule } from "./event-schedule"

const ROBOTO_FONT_URL =
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf"

const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const MARGIN = 48
const HEADER_HEIGHT = 120

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
}

async function embedHeaderImage(
  pdf: PDFDocument,
  page: PDFPage,
  headerImage: string,
  font: PDFFont
): Promise<number> {
  const contentWidth = page.getWidth() - MARGIN * 2
  let y = page.getHeight() - MARGIN

  const imageBytes = await resolveHeaderImageBytes(headerImage)
  if (imageBytes) {
    try {
      const isPng = headerImage.toLowerCase().includes(".png") || imageBytes[0] === 0x89
      const embedded = isPng ? await pdf.embedPng(imageBytes) : await pdf.embedJpg(imageBytes)
      const scale = Math.min(contentWidth / embedded.width, HEADER_HEIGHT / embedded.height)
      const w = embedded.width * scale
      const h = embedded.height * scale
      page.drawImage(embedded, {
        x: MARGIN + (contentWidth - w) / 2,
        y: y - h,
        width: w,
        height: h,
      })
      y -= h + 16
    } catch {
      y = drawLines(page, font, [""], MARGIN, y, 10, 12)
    }
  }

  return y
}

async function drawVoucherPage(
  pdf: PDFDocument,
  font: PDFFont,
  input: VoucherPdfPageInput,
  headerImage: string
): Promise<void> {
  const page = pdf.addPage([A4_WIDTH, A4_HEIGHT])
  const contentWidth = page.getWidth() - MARGIN * 2
  let y = await embedHeaderImage(pdf, page, headerImage, font)

  y = drawLines(
    page,
    font,
    wrapText(input.eventName, font, 18, contentWidth),
    MARGIN,
    y,
    18,
    22,
    rgb(0.05, 0.05, 0.05)
  )
  y -= 8

  y = drawLines(
    page,
    font,
    wrapText(
      formatEventDateRange(input.startDate, input.endDate, input.startTime, input.endTime),
      font,
      11,
      contentWidth
    ),
    MARGIN,
    y,
    11,
    14,
    rgb(0.3, 0.3, 0.3)
  )

  if (input.locationAddress) {
    y = drawLines(
      page,
      font,
      wrapText(input.locationAddress, font, 11, contentWidth),
      MARGIN,
      y,
      11,
      14,
      rgb(0.3, 0.3, 0.3)
    )
  }

  y -= 12
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: page.getWidth() - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  })
  y -= 20

  y = drawLines(page, font, ["Résztvevő"], MARGIN, y, 10, 12, rgb(0.45, 0.45, 0.45))
  y = drawLines(
    page,
    font,
    wrapText(input.displayName, font, 16, contentWidth),
    MARGIN,
    y,
    16,
    20
  )

  for (const field of input.attendeeFieldSchema) {
    const value = input.attendeeFields[field.key]
    if (value == null || value === "") continue
    const formatted = formatAttendeeFieldValue(field, value)
    if (formatted === "—") continue
    y = drawLines(
      page,
      font,
      wrapText(`${field.label}: ${formatted}`, font, 10, contentWidth),
      MARGIN,
      y,
      10,
      13,
      rgb(0.35, 0.35, 0.35)
    )
  }

  y -= 16

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

  const shortToken = input.token.slice(0, 8).toUpperCase()
  drawLines(
    page,
    font,
    [
      `Jegykód: ${shortToken}`,
      `Foglalás: ${input.bookingId.slice(-8).toUpperCase()}`,
      `${input.pageIndex}/${input.pageCount}`,
    ],
    MARGIN,
    MARGIN + 24,
    9,
    12,
    rgb(0.5, 0.5, 0.5)
  )

  drawLines(
    page,
    font,
    ["Mutassa be ezt a QR-kódot a beléptetésnél."],
    MARGIN,
    MARGIN,
    8,
    10,
    rgb(0.55, 0.55, 0.55)
  )
}

/** Build a multi-page voucher PDF — one page per guest. */
export async function buildVoucherPdf(input: BuildVoucherPdfInput): Promise<Uint8Array> {
  const fontBytes = await loadRobotoFont()
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes)

  const pageCount = input.pages.length
  for (let i = 0; i < pageCount; i += 1) {
    await drawVoucherPage(pdf, font, { ...input.pages[i], pageIndex: i + 1, pageCount }, input.headerImage)
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

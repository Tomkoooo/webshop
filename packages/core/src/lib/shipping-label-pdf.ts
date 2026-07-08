import "server-only"

import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import type { ShippingLabelSettings } from "@wse/core/services/shipping-label-settings"

const ROBOTO_FONT_URL =
  "https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Regular.ttf"

/** Avery-style 2" × 4" label (4" wide, 2" tall). */
const LABEL_WIDTH_PT = 4 * 72
const LABEL_HEIGHT_PT = 2 * 72

let cachedFontBytes: ArrayBuffer | null = null

async function loadRobotoFont(): Promise<ArrayBuffer> {
  if (cachedFontBytes) return cachedFontBytes
  const response = await fetch(ROBOTO_FONT_URL)
  if (!response.ok) {
    throw new Error("A címke betűtípus betöltése sikertelen.")
  }
  cachedFontBytes = await response.arrayBuffer()
  return cachedFontBytes
}

export type ShippingLabelOrderSnapshot = {
  billingInfo?: { name?: string; email?: string; phone?: string }
  shippingAddress?: {
    name?: string
    email?: string
    phone?: string
    zip?: string
    city?: string
    street?: string
    comment?: string
    country?: string
  }
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

function drawLabel(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  y: number,
  fontSize: number
): number {
  page.drawText(text, { x, y, size: fontSize, font, color: rgb(0.45, 0.45, 0.45) })
  return y - fontSize - 2
}

export async function buildStandardShippingLabelPdf(
  order: ShippingLabelOrderSnapshot,
  company: ShippingLabelSettings
): Promise<Uint8Array> {
  const fontBytes = await loadRobotoFont()
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const font = await pdf.embedFont(fontBytes)

  const page = pdf.addPage([LABEL_WIDTH_PT, LABEL_HEIGHT_PT])
  const margin = 8
  const contentWidth = page.getWidth() - margin * 2
  const minY = margin
  let y = page.getHeight() - margin

  y = drawLabel(page, font, "FELADÓ", margin, y, 6)
  const senderLines = [
    company.companyName,
    [company.companyStreet, company.companyZip, company.companyCity].filter(Boolean).join(", "),
    company.companyPhone ? `Tel.: ${company.companyPhone}` : "",
    company.companyEmail ? `E-mail: ${company.companyEmail}` : "",
  ].filter(Boolean)
  y = drawLines(
    page,
    font,
    senderLines.flatMap((line) => wrapText(line, font, 6.5, contentWidth)),
    margin,
    y,
    6.5,
    8
  )
  y -= 4

  y = drawLabel(page, font, "CÍMZETT", margin, y, 7)
  const shipping = order.shippingAddress || {}
  const recipientName = shipping.name || order.billingInfo?.name || "—"
  const addressLine = [shipping.street, shipping.zip, shipping.city].filter(Boolean).join(", ")
  const phone = shipping.phone || order.billingInfo?.phone
  const email = shipping.email || order.billingInfo?.email

  y = drawLines(page, font, wrapText(recipientName, font, 9, contentWidth), margin, y, 9, 10.5)
  if (addressLine) {
    y = drawLines(
      page,
      font,
      wrapText(addressLine, font, 8, contentWidth),
      margin,
      y,
      8,
      9.5
    )
  }
  if (shipping.country) {
    y = drawLines(page, font, [shipping.country], margin, y, 7, 8.5)
  }
  if (phone) {
    y = drawLines(page, font, [`Tel.: ${phone}`], margin, y, 7, 8.5)
  }
  if (email) {
    y = drawLines(
      page,
      font,
      wrapText(`E-mail: ${email}`, font, 7, contentWidth),
      margin,
      y,
      7,
      8.5
    )
  }
  if (shipping.comment && y > minY + 10) {
    y = drawLines(
      page,
      font,
      wrapText(`Megj.: ${shipping.comment}`, font, 6.5, contentWidth).slice(0, 2),
      margin,
      y,
      6.5,
      8,
      rgb(0.35, 0.35, 0.35)
    )
  }

  if (company.footerNote && y > minY + 8) {
    drawLines(
      page,
      font,
      wrapText(company.footerNote, font, 6, contentWidth).slice(0, 1),
      margin,
      minY,
      6,
      7,
      rgb(0.45, 0.45, 0.45)
    )
  }

  return pdf.save()
}

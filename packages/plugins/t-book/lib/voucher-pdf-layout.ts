/** Editable voucher PDF layout stored per organization (optional event override later). */

export type VoucherPdfBlockType =
  | "headerImage"
  | "title"
  | "subtitle"
  | "eventSchedule"
  | "location"
  | "attendeeFields"
  | "qrCode"
  | "customText"
  | "footer"

export type VoucherPdfBlock = {
  id: string
  type: VoucherPdfBlockType
  enabled: boolean
  /** For customText */
  text?: string
  fontSize?: number
  /** hex like #111827 */
  color?: string
  align?: "left" | "center" | "right"
}

export type VoucherPdfLayout = {
  margin: number
  headerHeight: number
  titleFontSize: number
  bodyFontSize: number
  primaryColor: string
  showPageNumbers: boolean
  blocks: VoucherPdfBlock[]
}

export const DEFAULT_VOUCHER_PDF_LAYOUT: VoucherPdfLayout = {
  margin: 48,
  headerHeight: 120,
  titleFontSize: 20,
  bodyFontSize: 11,
  primaryColor: "#111827",
  showPageNumbers: true,
  blocks: [
    { id: "header", type: "headerImage", enabled: true },
    { id: "title", type: "title", enabled: true, fontSize: 20, align: "left" },
    { id: "subtitle", type: "subtitle", enabled: true, fontSize: 16 },
    { id: "schedule", type: "eventSchedule", enabled: true, fontSize: 11 },
    { id: "location", type: "location", enabled: true, fontSize: 11 },
    { id: "attendee", type: "attendeeFields", enabled: true, fontSize: 11 },
    { id: "qr", type: "qrCode", enabled: true, align: "center" },
    { id: "footer", type: "footer", enabled: true, fontSize: 9, color: "#6b7280" },
  ],
}

export function normalizeVoucherPdfLayout(
  raw: Partial<VoucherPdfLayout> | null | undefined
): VoucherPdfLayout {
  const base = DEFAULT_VOUCHER_PDF_LAYOUT
  if (!raw || typeof raw !== "object") return { ...base, blocks: base.blocks.map((b) => ({ ...b })) }

  const blocks =
    Array.isArray(raw.blocks) && raw.blocks.length > 0
      ? raw.blocks
          .filter((b): b is VoucherPdfBlock => Boolean(b && typeof b === "object" && b.id && b.type))
          .map((b) => ({
            id: String(b.id),
            type: b.type,
            enabled: b.enabled !== false,
            text: b.text != null ? String(b.text) : undefined,
            fontSize: typeof b.fontSize === "number" ? b.fontSize : undefined,
            color: b.color != null ? String(b.color) : undefined,
            align: b.align === "center" || b.align === "right" || b.align === "left" ? b.align : undefined,
          }))
      : base.blocks.map((b) => ({ ...b }))

  return {
    margin: typeof raw.margin === "number" ? raw.margin : base.margin,
    headerHeight: typeof raw.headerHeight === "number" ? raw.headerHeight : base.headerHeight,
    titleFontSize: typeof raw.titleFontSize === "number" ? raw.titleFontSize : base.titleFontSize,
    bodyFontSize: typeof raw.bodyFontSize === "number" ? raw.bodyFontSize : base.bodyFontSize,
    primaryColor: typeof raw.primaryColor === "string" ? raw.primaryColor : base.primaryColor,
    showPageNumbers: raw.showPageNumbers !== false,
    blocks,
  }
}

export const VOUCHER_PDF_BLOCK_LABELS: Record<VoucherPdfBlockType, string> = {
  headerImage: "Fejléckép",
  title: "Esemény neve",
  subtitle: "Résztvevő neve",
  eventSchedule: "Időpont",
  location: "Helyszín",
  attendeeFields: "Résztvevői adatok",
  qrCode: "QR kód",
  customText: "Egyedi szöveg",
  footer: "Lábléc / oldalszám",
}

import { format } from "date-fns"
import type { ITBookBooking } from "../models/TBookBooking"
import { formatAttendeeFieldValue } from "./attendee-fields"

const STATUS_LABELS: Record<string, string> = {
  pending: "Függőben",
  checkout_started: "Fizetés folyamatban",
  paid: "Fizetve",
  confirmed: "Visszaigazolva",
  cancelled: "Lemondva",
  expired: "Lejárt",
}

const INVOICE_LABELS: Record<string, string> = {
  none: "Nincs",
  issued: "Kiállítva",
  failed: "Sikertelen",
  reversed: "Sztornózva",
}

function formatSelectionValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ")
  if (typeof value === "boolean") return value ? "Igen" : "Nem"
  return String(value ?? "")
}

/**
 * Smart export rows: fixed columns + dynamic attendee columns + selection option columns.
 */
export function buildBookingExportRows(bookings: ITBookBooking[]): Record<string, string>[] {
  const selectionKeys = new Set<string>()
  for (const booking of bookings) {
    for (const key of Object.keys(booking.selections ?? {})) selectionKeys.add(key)
  }
  const orderedSelectionKeys = [...selectionKeys].sort()

  return bookings.map((booking) => {
    const row: Record<string, string> = {
      "Foglalás ID": String(booking._id),
      Esemény: booking.eventName,
      Csoport: booking.groupName || "",
      Szállás: booking.hotelName || "—",
      "Kapcsolattartó neve": booking.customer.name,
      "Kapcsolattartó email": booking.customer.email,
      "Kapcsolattartó telefon": booking.customer.phone,
      Létszám: String(booking.guests),
      Éjszakák: booking.hotelName ? String(booking.nights) : "",
    }

    const schema = booking.attendeeFieldSchema ?? []
    booking.attendees?.forEach((attendee, index) => {
      for (const field of schema) {
        row[`Résztvevő ${index + 1}: ${field.label}`] = formatAttendeeFieldValue(
          field,
          attendee.fields[field.key]
        )
      }
    })

    for (const key of orderedSelectionKeys) {
      row[`Opció: ${key}`] = formatSelectionValue(booking.selections?.[key])
    }
    row["Jegy összesen (Ft)"] = String(booking.quote.ticketSubtotalHuf)
    row["Szállás összesen (Ft)"] = String(booking.quote.accommodationSubtotalHuf)
    row["Végösszeg (Ft)"] = String(booking.totalHuf)
    row["Státusz"] = STATUS_LABELS[booking.status] ?? booking.status
    row["Számla"] = INVOICE_LABELS[booking.invoiceStatus] ?? booking.invoiceStatus
    row["Számlaszám"] = booking.invoiceId ?? ""
    row["Létrehozva"] = booking.createdAt
      ? format(new Date(booking.createdAt), "yyyy-MM-dd HH:mm")
      : ""
    row["Fizetve"] = booking.paidAt ? format(new Date(booking.paidAt), "yyyy-MM-dd HH:mm") : ""
    return row
  })
}

export async function buildBookingExcelBuffer(
  bookings: ITBookBooking[],
  meta: { title: string }
): Promise<Buffer> {
  const XLSX = await import("xlsx")
  const rows = buildBookingExportRows(bookings)
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "Foglalások")

  const metaSheet = XLSX.utils.aoa_to_sheet([
    ["Exportálva", format(new Date(), "yyyy-MM-dd HH:mm:ss")],
    ["Szűrés", meta.title],
    ["Sorok száma", rows.length],
  ])
  XLSX.utils.book_append_sheet(workbook, metaSheet, "Meta")

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer
}

export function buildBookingCsv(bookings: ITBookBooking[]): string {
  const rows = buildBookingExportRows(bookings)
  if (rows.length === 0) return ""
  const headers = Object.keys(rows[0])
  const escape = (value: string) =>
    /[",\n;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  const lines = [headers.map(escape).join(";")]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h] ?? "")).join(";"))
  }
  return `\uFEFF${lines.join("\n")}`
}
